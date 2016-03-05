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

/*global require, module, console, process */
/* eslint-env es6 */
"use strict";
var Q = require("q");
var caplib = require("./caplib");
var makeSaver = require("./saver").makeSaver;
var log = function(text) {console.log(text);};


function main(argv, require, crypto, fs, path, createServer, express) {
    var unique = caplib.makeUnique(crypto.randomBytes);
    var reviver = makeReviver(require);
    const dbfile = fsSyncAccess(fs, path.join, "capper.db");
    var rd = p => fsReadAccess(fs, path.join, p);
    var sslDir = rd("./ssl");

    makeConfig(rd("capper.config")).then(config => {
        run(argv, config, reviver, unique, sslDir, dbfile,
            createServer, express);
    });
}

var exports = module.exports;
exports.caplib = caplib;

exports.fsReadAccess = fsReadAccess;
function fsReadAccess(fs /*: FileSystem */,
                      join /*:(...parts: Array<string>) => string*/,
                      path /*: string*/) /*: ReadAccess*/ {
    return Object.freeze({
        readText: (encoding /*: string*/) =>
            Q.nfcall(fs.readFile, path, encoding),
        readBytes: () =>
            Q.nfcall(fs.readFile, path),
        subRd: (other) => fsReadAccess(fs, join, join(path, other))
    });
}

exports.fsWriteAccess = fsWriteAccess;
function fsWriteAccess(fs /*: FileSystem */,
                       join /*:(...parts: Array<string>) => string*/,
                       path /*: string*/) /*: WriteAccess*/ {
    return Object.freeze({
        writeText: (text) =>
            Q.nfcall(fs.writeFile, path, text),
        subWr: (other) => fsWriteAccess(fs, join, join(path, other)),
        ro: () => fsReadAccess(fs, join, path)
    });
}

exports.fsSyncAccess = fsSyncAccess;
function fsSyncAccess(fs /*: FileSystem */,
                      join /*:(...parts: Array<string>) => string*/,
                      path /*: string*/) /*: SyncAccess*/ {
    return Object.freeze({
        existsSync: () => fs.existsSync(path),
        readTextSync: (encoding) => fs.readFileSync(path, encoding),
        writeSync: (contents) => fs.writeFileSync(path, contents),
        unsync: () => fsWriteAccess(fs, join, path)
    });
}

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
        log("config domain " + domain);
        return {domain: domain, port: port};
    }).catch(err => {log("bad capper.config file" + err); throw(err);});
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


function makeReviver(require) /*: Reviver*/ {
    function toMaker(reviver) {
        var parts = reviver.split(".");
        var path = "./apps/" + parts[0] +"/server/main.js";
        var maker = require(path);
        if (parts.length === 2) {maker = maker[parts[1]];}
        return maker;
    }

    function sendUI(res, reviver) {
        var revstring = "./apps/";
        var parts = reviver.split(".");
        revstring = revstring + parts[0] + "/ui/";
        var filename = parts.length > 1 ? parts[1] : "index";
        revstring += filename + ".html";
        res.sendfile(revstring);
    }

    return Object.freeze({
        toMaker: toMaker,
        sendUI: sendUI
    });
}



function makeSturdy(saver, domain) {

    function vowAnsToVowJSONString(vowAns) {
        return vowAns.then(function(ans) {
            var result = caplib.deepObjToJSON(ans, idToWebkey, saver);
            log(JSON.stringify(result));
            if (result !== null && typeof result === "object" && ("@" in result)) {
                return JSON.stringify(result);
            } else {return JSON.stringify({"=": result});}
        }, function(err){
            log("vowAnsToVowJSONString err " + err);
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
                //log("wkeyObj is webkey, cred is " + cred);
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

    var app = express();
    app.get("/views/:filename", function(req, res) {
        res.sendfile("./views/" + req.params.filename);
    });
    app.get("/views/:path1/:filename", function(req, res) {
        res.sendfile("./views/" + req.params.path1 + "/" + req.params.filename);
    });
    app.get("/apps/:theapp/ui/:filename", function(req, res) {
        res.sendfile("./apps/" + req.params.theapp + "/ui/" + req.params.filename);
    });
    app.get("/", function(req, res) {
        res.sendfile("./views/index.html");
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
            res.sendfile("./bootstrap.html");
        } else {
            try {
                var objdata = getObj(req);
                if (!objdata.live) {res.send("no such object");}
                //res.setHeader("Content-Security-Policy", "default-src: 'self'");
                //log("set CSP header");
                //res.writeHead(200)
                sendUI(res, objdata.reviver);
            } catch (err) {
                console.log('showActor not found:', err);
                res.send("Object not Found");
                //res.close();
            }
        }
    }
    app.get("/ocaps/", showActor);

    function invokeActor(req, res){
        log("post query " + JSON.stringify(req.query));
        log("post body: " + JSON.stringify(req.body));
        var objdata = getObj(req);
        if (!objdata.live) {
            res.send(JSON.stringify({"!": "bad object invoked"}));
            log("bad object invoked: " + JSON.stringify(req.query));
            return;
        }
        var args = req.body; //body already parsed
        var translatedArgs = [objdata.id, objdata.method];
        args.forEach(function(next) {translatedArgs.push(webkeyToLive(next));});
        var vowAns = saver.deliver.apply(null, translatedArgs);
        vowAnsToVowJSONString(vowAns).then(function(jsonString){
            log("returning: " + jsonString);
            res.send(jsonString);
        }).done();
    }
    app.post("/ocaps/", parseBody, invokeActor);

    return app;
}


/*::
// only import the types, not the ambient authority.
const https = require("https");
 */

exports.run = run;
function run(argv /*: Array<string>*/,
             config /*: Config*/,
             reviver /*: Reviver*/,
             unique /*: () => string*/,
             sslDir /*: ReadAccess*/,
             dbfile /*: SyncAccess*/,
             createServer /*: typeof https.createServer */,
             express /*: () => Application */) {
    const saver = makeSaver(unique, dbfile, reviver.toMaker);
    const sturdy = makeSturdy(saver, config.domain);

    var argMap = caplib.argMap(argv, sturdy.wkeyStringToLive);
    if ("-drop" in argMap) {
        saver.drop(saver.credToId(argMap["-drop"][0]));
        saver.checkpoint().then(function() {console.log("drop done");});
    } else if ("-make" in argMap){
        var obj = saver.make.apply(undefined, argMap["-make"]);
        if (!obj) {log("cannot find maker " + argMap["-make"]); return;}
        saver.checkpoint().then(function() {
            log(sturdy.idToWebkey(saver.asId(obj)));
        }).done();
    } else if ("-post" in argMap) {
        var args = argMap["-post"];
        if (typeof args[0] !== "object") {
            log("bad target object webkey; forget '@'?");
        } else if (typeof args[1] !== "string") {
            log("method to invoke is not a string");
        } else {
            args[0] = saver.asId(args[0]);
            var vowAns = saver.deliver.apply(undefined, args);
            sturdy.vowAnsToVowJSONString(vowAns).then(function(answer){
                log(answer);
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


if (require.main == module) {
    main(process.argv,
         require,  // to load app modules
         require("crypto"),
         require("fs"), require("path"),
         require("https").createServer,
         require("express")
        );
}
