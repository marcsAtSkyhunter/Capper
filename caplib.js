/*global console, require */

module.exports = function() {
"use strict";

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
 * finding commands such and drop and make, if a command line has an arg 
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

var self = {
    typeCheck: typeCheck,
    unique: unique,
    valid: valid,
    tvalid: tvalid,
    makeSealerPair: makeSealerPair,
    cloneMap: cloneMap,
    argMap:argMap
};
return self;

}();