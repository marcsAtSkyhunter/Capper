/* 
Copyright 2014 Marc Stiegler. This library is free software;
you can redistribute it and/or modify it under the terms of the GNU
Lesser General Public License (LGPL) as published by the Free Software
Foundation; either version 2.1 of the License, or (at your option) any
later version.  This library is distributed in the hope that it will
be useful, but WITHOUT ANY WARRANTY; without even the implied warranty
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.
*/

/*global require, setTimeout  */

var https = require("https");
var Q = require("q");
var url = require("url");
function log(text) {console.log(text);}

var makeProxy;
function deepProxyConvert(obj) {
    "use strict";
    if (!obj || typeof obj !== "object") {return obj;}
    for (var key in obj) {
        if (obj[key] && typeof (obj[key]) === "object" ) {
            if (obj[key]["@"]) {
                obj[key] = makeProxy(obj[key]);                    
            } else {
                obj[key] = deepProxyConvert(obj[key]);
            }
        }
    }
    return obj;
}
makeProxy = function(JSONkey) {
    "use strict";
    var keyparts = JSONkey["@"].split("#s=");
    var cred = keyparts[1];
    var mainUrl = keyparts[0];
    var urlParts = url.parse(mainUrl);
    var options = {
        hostname: urlParts.hostname,
        port: urlParts.port,
        path: urlParts.pathname,
        rejectUnauthorized: false,
        method: "POST"
    };
    options.agent = new https.Agent(options);
    function post(method, optArgs) {
        var args = [];
        for (var i = 1; i < arguments.length; i++) {
            if (arguments[i].isProxy ) {
                args.push({"@":arguments[i].webkey});
            } else {args.push(arguments[i]);}     
        }
        var vowPair = Q.defer();
        /*
        var xhr = new XMLHttpRequest();
        var target = domain + "?s=" + cred + "&q=" + method ;
        xhr.onreadystatechange=function(){
            if (xhr.readyState !== 4) {return;}
            if (xhr.status===200){
                try {
                    var ans = JSON.parse(xhr.responseText);
                    if ("=" in ans) {
                        vowPair.fulfill(deepProxyConvert(ans["="]));
                    } else if ("!" in ans) {
                        vowPair.reject(ans["!"]);		
                    }else if ("@" in ans){
                        vowPair.fulfill(makeProxy(ans));                        
                    } else {
                        vowPair.reject(
                            "invalid response not capper/waterken protocol");                        
                    }                    
                } catch (err) {vowPair.reject("bad response: " + xhr.responseText);}
            } else {vowPair.reject("post failed status " + xhr.status);}
        };
        xhr.open("POST", target, true);
        xhr.setRequestHeader("Content-Type","text/plain");
        var data =  JSON.stringify(args);
        log("remoteproxy.post args: " + data)
        xhr.send(data);
        */
        var data ="";
        options.path = urlParts.pathname+"?s=" + cred + "&q=" + method;
        var req = https.request(options, function(res) {
          log("statusCode: ", res.statusCode);
          log("headers: ", res.headers);
        
          res.on('data', function(d) {
            log(d);
            data += d;
          });
          res.on("end", function() {
            log("got end msg");
            try {
                var ans = JSON.parse(data);
                if ("=" in ans) {
                    vowPair.fulfill(deepProxyConvert(ans["="]));
                } else if ("!" in ans) {
                    vowPair.reject(ans["!"]);
                }else if ("@" in ans){
                    vowPair.fulfill(makeProxy(ans));                        
                } else {
                    vowPair.reject(
                        "invalid response not capper/waterken protocol");                        
                }                    
            } catch (err) {vowPair.reject("bad response: " + err);}
          });
        });
        req.on("error", function(err){log("remoteProxy request err: " + err + " on " +
            JSONkey["@"] + " " + method);});
        req.write(JSON.stringify(args));
        req.end();
        return vowPair.promise;
    }
    return Object.freeze({
        webkey: JSONkey["@"],
        isProxy: true,
        post: post
    });
};
function keyToProxy(keyString) {return makeProxy({"@": keyString});}
module.exports = keyToProxy;
