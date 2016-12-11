/*
Copyright 2011 Hewlett-Packard Company. This library is free software;
you can redistribute it and/or modify it under the terms of the GNU
Lesser General Public License (LGPL) as published by the Free Software
Foundation; either version 2.1 of the License, or (at your option) any
later version.  This library is distributed in the hope that it will
be useful, but WITHOUT ANY WARRANTY; without even the implied warranty
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.  You should have
received a copy of the GNU Lesser General Public License (LGPL) along
with this library; if not, write to the Free Software Foundation,
Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
Please contact the Hewlett-Packard Company <www.hp.com> for
information regarding how to obtain the source code for this library.

 @flow
*/

/*global require, module, console, process, __dirname */
/* eslint-env es6 */
"use strict";
var Q = require("q");
var caplib = require("./caplib");
var makeReviver = require("./saver").makeReviver;
var makeSaver = require("./saver").makeSaver;
var io = require("./saver");


function main(argv, require, crypto, fs, path, createServer, express) {
    const rd = p => io.fsReadAccess(fs, path.join, p);
    const unique = caplib.makeUnique(crypto.randomBytes);
    const dbfile = io.fsSyncAccess(fs, path.join, "capper.db");
    const reviver = makeReviver(require);
    const saver = makeSaver(unique, dbfile, reviver.toMaker)

    makeConfig(rd("capper.config")).then(config => {
        run(argv, config, reviver, saver, rd("./ssl"),
            createServer, express);
    });
}

var exports = module.exports;
exports.caplib = caplib;
exports.makeSaver = makeSaver;
exports.fsSyncAccess = io.fsSyncAccess;
exports.fsWriteAccess = io.fsWriteAccess;
exports.fsReadAccess = io.fsReadAccess;

/*::
type Config = {
  domain: string,
   port: number
};
*/
exports.makeConfig = makeConfig;
function makeConfig(rd /*: ReadAccess */) /*: Promise<Config>*/ {
    return rd.readText("utf8").then(data => {
        var config = JSON.parse(data);
        var port = config.port;
        var domain = config.protocol + "://" + config.domain + ":" + config.port + "/";
        console.log("config domain " + domain);
        return {domain: domain, port: port};
    }).catch(err => {console.error("bad capper.config file", err); throw(new Error(err));});
}

function sslOptions(files /*: ReadAccess */) {
    var file = name => files.subRd(name).readBytes();
    return Q.spread(
        [file("server.key"), file("server.crt"), file("ca.crt")],
        (key, cert, ca) => ({
            key: key,
            cert: cert,
            ca: ca,
            requestCert: true,
            rejectUnauthorized: false
        }));
}


function parseBody(req, res, next) {
    req.rawBody = "";
    req.setEncoding("utf8");

    req.on("data", function(chunk) {
        req.rawBody += chunk;
    });

    req.on("end", function() {
        try {req.body = JSON.parse(req.rawBody);} catch (e) {
            // ignore JSON.parse errors
        }
        next();
    });
}


function makeSturdy(saver, domain) {

    function vowAnsToVowJSONString(vowAns) {
        return vowAns.then(function(ans) {
            var result = caplib.deepObjToJSON(ans, idToWebkey, saver);
            console.log(result);
            if (result !== null && typeof result === "object" && ("@" in result)) {
                return JSON.stringify(result);
            } else {return JSON.stringify({"=": result});}
        }, function(err){
            console.error("vowAnsToVowJSONString err ", err);
            return JSON.stringify({"!": err});
        });
    }
    /**
     * webkeyToLive(wkeyObj) looks to see if the arg is a webkeyObject, if so,
     * returns a live ref, otherwise returns the arg unchanged
     */
    function webkeyToLive(wkeyObj) {
        try {
            if (wkeyObj["@"]) {
                var cred = wkeyObj["@"].split("#s=")[1];
                //console.log("wkeyObj is webkey, cred is " + cred);
                return saver.live(saver.credToId(cred));
            } else {return wkeyObj;}
        } catch (err) {return wkeyObj;}
    }
    function idToWebkey(id) {
        return domain + "ocaps/#s=" + saver.idToCred(id);
    }

    function wkeyStringToLive(keyString) {
        return webkeyToLive({"@": keyString});
    }

    return {
        idToWebkey: idToWebkey,
        vowAnsToVowJSONString: vowAnsToVowJSONString,
        webkeyToLive: webkeyToLive,
        wkeyStringToLive: wkeyStringToLive
    };
}


function makeApp(express, saver, sturdy, sendUI) {
    var webkeyToLive = sturdy.webkeyToLive;
    var vowAnsToVowJSONString = sturdy.vowAnsToVowJSONString;

    const view = path => __dirname + "/views/" + path;
    var app = express();
    app.get("/views/*", function(req, res) {
        res.sendfile(view(req.params[0]));
    });
    app.get("/apps/:theapp/ui/*", function(req, res) {
        sendUI(res, req.params.theapp, req.params[0]);
    });
    app.get("/", function(req, res) {
        res.sendfile(view("index.html"));
    });

    function getObj(req) {
        var cred = req.query.s;
        var id = saver.credToId(cred);
        var reviver = saver.reviver(id);
        var live = saver.live(id);
        return {
            cred: cred,
            reviver: reviver,
            live: live,
            id: id,
            method: req.query.q
        };
    }

    function showActor(req, res) {
        if (!req.query.s ) {
            res.sendfile(__dirname + "/bootstrap.html");
        } else {
            try {
                var objdata = getObj(req);
                if (!objdata.live) {res.send("no such object");}
                //res.setHeader("Content-Security-Policy", "default-src: 'self'");
                //console.log("set CSP header");
                //res.writeHead(200)
                sendUI(res, objdata.reviver);
            } catch (err) {
                console.error('showActor not found:', err);
                res.send("Object not Found");
                //res.close();
            }
        }
    }
    app.get("/ocaps/", showActor);

    function invokeActor(req, res){
        console.log("post query ", req.query);
        console.log("post body: ", req.body);
        var objdata = getObj(req);
        if (!objdata.live) {
            res.send(JSON.stringify({"!": "bad object invoked"}));
            console.error("bad object invoked: ", req.query);
            return;
        }
        var args = req.body; //body already parsed
        var translatedArgs = [objdata.id, objdata.method];
        args.forEach(function(next) {translatedArgs.push(webkeyToLive(next));});
        var vowAns = saver.deliver.apply(null, translatedArgs);
        vowAnsToVowJSONString(vowAns).then(function(jsonString){
            console.log("returning: ", jsonString);
            res.send(jsonString);
        }).done();
    }
    app.post("/ocaps/", parseBody, invokeActor);

    return app;
}


/*::
// only import the types, not the ambient authority.
const https = require("https");
const http = require("http");
 */

exports.run = run;
function run(argv /*: Array<string>*/,
             config /*: Config*/,
             reviver /*: Reviver*/,
             saver /*: Saver*/,
             sslDir /*: ReadAccess*/,
             createServer /*: typeof https.createServer */,
             express /*: () => Application */) {
    const sturdy = makeSturdy(saver, config.domain);

    var argMap = caplib.argMap(argv, sturdy.wkeyStringToLive);
    if ("-drop" in argMap) {
        saver.drop(saver.credToId(argMap["-drop"][0]));
        saver.checkpoint().then(function() {console.log("drop done");});
    } else if ("-make" in argMap){
        var obj = saver.make.apply(undefined, argMap["-make"]);
        if (!obj) {console.error("cannot find maker " + argMap["-make"]); return;}
        saver.checkpoint().then(function() {
            console.log(sturdy.idToWebkey(saver.asId(obj)));
        }).done();
    } else if ("-post" in argMap) {
        var args = argMap["-post"];
        if (typeof args[0] !== "object") {
            console.error("bad target object webkey; forget '@'?");
        } else if (typeof args[1] !== "string") {
            console.error("method to invoke is not a string");
        } else {
            args[0] = saver.asId(args[0]);
            var vowAns = saver.deliver.apply(undefined, args);
            sturdy.vowAnsToVowJSONString(vowAns).then(function(answer){
                console.log(answer);
            });
        }
    } else {
        const app = makeApp(express, saver, sturdy, reviver.sendUI);
        sslOptions(sslDir).then(sslOpts => {
            var s = createServer(sslOpts, app);
            s.listen(config.port);
        }).done();
    }
}

exports.runNaked = runNaked;
function runNaked(config /*: Config*/,
                  reviver /*: Reviver*/,
                  saver /*: Saver*/,
                  createServer /*: typeof http.createServer */,
                  express /*: () => Application */) {
    const sturdy = makeSturdy(saver, config.domain);
    const app = makeApp(express, saver, sturdy, reviver.sendUI);
    var s = createServer(app);
    s.listen(config.port);
}


if (require.main == module) {
    main(process.argv,
         require,  // to load app modules
         require("crypto"),
         require("fs"), require("path"),
         require("https").createServer,
         require("express")
        );
}
