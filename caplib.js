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
*/

/*global console, require, module */
module.exports = function() {
"use strict";
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
/**
 * Function typeCheck allows a quick, concise limited form of duck typing of the
 * arguments to a function. The function using typeCheck should pass in its 
 * arguments plus a character specifying a type for each argument to be
 * tested. The types are:
 *    {
 *       n: "number",
 *       s: "string",
 *       f: "function",
 *       o: "object",
 *       b: "boolean"
 *    }
 * Example usage, the function add(num1, num2) would look as follows:
 * function add(x,y) {
 *     duck(arguments, "nn");
 *     return x + y;
 * }
 *
 * If the first two arguments to add were not numbers, typeCheck logs to console and returns false.
 *
 * Additional rules:
 * Duck will throw an exception if there are more tests than arguments. 
 * However, if there are additional arguments for which there are not tests, it will pass.
 * Duck will throw if it gets a null or undefined for any argument.
 **/
function typeCheck(args, validTypes) { 
    var types = {
        n: "number",
        s: "string",
        f: "function",
        o: "object",
        b: "boolean"
    };  
    //you can have untested args, but not tests for which there are no args
    if (args.length < validTypes.length) {throw "typeCheck has more tests than args";}    
    for (var i = 0; i < validTypes.length; i++) {
        if (args[i] === null) {console.log("typeCheck found null"); return false;}
        var typ = validTypes[i];
        if (typeof(args[i]) !== types[typ]) {
            console.log("typeCheck bad arg " + i + " should be: " + typ  + 
			" was " + typeof(args[i]));
            return false;
        }
    }
    return true;
}

function valid(test, errMsg) {
    if (test) {return true;}
    console.log("invalid: " + errMsg);
    throw("invalid: " + errMsg);
}

function tvalid(args, types, additionalTest, errMsg) {
    return valid(typeCheck(args, types) && additionalTest, errMsg);
}

function unique() {
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
    var ans = "";
    var buf = crypto.randomBytes(25);
    for (var i = 0; i < buf.length; i++) {
        var index = buf[i] % chars.length;
        ans += chars[index];
    }
   //while (ans.length < 30) {
   //   var nextI = Math.floor(Math.random()*10000) % chars.length;
   //   ans += chars[nextI];
   //}
   return ans;
}
function makeSealerPair() {
    var holder = null;
    function seal(x) {
        var box = function() {holder = x;};
        return box;
    }
    function unseal(box) {
        holder = null;
        box();
        var ans = holder;
        holder = null;
        return ans;
    }
    return {seal:seal, unseal:unseal};
}

function cloneMap(m) {
    var clone = {};
    for (var key in m) {clone[key] = m[key];}
    return clone;
}
/**
 * If the obj is a persistent object, or if the obj contains a ref to a persistent
 * object, or the id of a persistent obj ({"@id": cred}), replace the object with 
 * a webkey object (i.e., {"@" : webkey}). If
 * a function is encountered, convert to null and log it. In all other cases,
 * leave it alone.
 * 
 * In the end, return the json string of the result.
 * 
 * TODO: the in-place replacement makes it possible for the persistent app
 * that produced this array or map to see the webkeys of the live
 * objects it included. Unnecessary loss of encapsulation.
 * Do copy, not in-place replace.
 * */
function deepObjToJSON(obj, idToWebkey, saver) {
    if (obj === undefined) {return null;}
    if (obj === null) {return null;}
    if (typeof obj === "function") {
        console.log("bad function in deepConvertToJSON");
        return null;
    }
    if (typeof obj !== "object") {return obj;}
    if (saver.hasId(obj)) {
        var webkey = idToWebkey(saver.asId(obj));
        return {"@" : webkey};
    }  
    if (saver.live(obj)) {return {"@": idToWebkey(obj)};}
    var clone = obj instanceof Array  ? [] : {};
    for (var key in obj) {
        clone[key] = deepObjToJSON(obj[key], idToWebkey, saver);
    }
    return clone;
}

/**
 * finding commands such as drop and make, if a command line has an arg 
 * after "server" make the rest of the args elements in map
 * Returns map with one entry, the first post=server element as key, 
 * following args as list
 * Converts args preceded with "#" to numbers
 * Converts args preceded with "@" to live refs
 * */
function argMap(argv, webkeyStringToLive) {
    var args = {}; 
    var serverIndex;
    for (serverIndex  = 0; 
        serverIndex < argv.length && argv[serverIndex].indexOf ("server") < 0; 
        serverIndex++) {}
    if (serverIndex === argv.length - 1) {return args;}
    var command = argv[serverIndex+1];
    var commandArgs = argv.splice(serverIndex+2);
    commandArgs.forEach(function(next, i) {
        if (next.indexOf("#") === 0) {
            commandArgs[i] = parseFloat(next.substring(1));
        } else if (next.indexOf("@") === 0) {
            commandArgs[i] = webkeyStringToLive(next.substring(1));
        }
    });
    args[command] = commandArgs;
    return args;
}

function copyFile(src, dest) {
    var data = fs.readFileSync(src);
    fs.writeFileSync(dest);    
}
function copyRecurse(src, dest) {
  var exists = fs.existsSync(src);
  var stats = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (exists && isDirectory) {
    fs.mkdirSync(dest);
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecurse(path.join(src, childItemName),
                        path.join(dest, childItemName));
    });
  } else if (exists) {copyFile(src, dest);}
}
function makeNewServer() {
    function copyIfAbsent(dest) {
        var srcDir = path.dirname(module.filename);
        if (!fs.existsSync(dest)) {
            copyRecurse(path.join(srcDir, dest), dest);
        }
    }
    copyIfAbsent("capper.db");
    copyIfAbsent("capper.config");
    copyIfAbsent("apps");
    copyIfAbsent("test");
    copyIfAbsent("views");
    copyIfAbsent("ssl");
}

var self = {
    typeCheck: typeCheck,
    unique: unique,
    valid: valid,
    tvalid: tvalid,
    makeSealerPair: makeSealerPair,
    cloneMap: cloneMap,
    argMap:argMap,
    deepObjToJSON: deepObjToJSON,
    makeNewServer: makeNewServer,
    copyRecurse: copyRecurse
};
return self;

}();