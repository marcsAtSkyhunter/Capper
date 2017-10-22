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

/*global console, module */
/* jshint esversion: 6, node: true */

"use strict";
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
function typeCheck(args /*:Array<any>*/, validTypes /*: string*/) /*:bool*/ {
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

function valid(test /*: any*/, errMsg /*: string*/) /*: bool*/ {
    if (test) {return true;}
    console.log("invalid: " + errMsg);
    throw("invalid: " + errMsg);
}

function tvalid(args /*:Array<any>*/, types /*: string*/, additionalTest /*:bool*/, errMsg /*: string*/) /*:bool*/ {
    return valid(typeCheck(args, types) && additionalTest, errMsg);
}

function makeUnique(randomBytes /*: (qty: number) => Array<number>*/
                   ) /*: () => string*/{

    function unique() {
        var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
        var ans = "";
        var buf = randomBytes(25);
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

    return unique;
}

function makeSealerPair/*::<T>*/() /*: SealerPair<T> */{
    var holder /*:?T*/ = null;
    function seal(x /*:T*/) {
        var box = function() {holder = x;};
        return box;
    }
    function unseal(box) /*:?T*/ {
        holder = null;
        box();
        var ans = holder;
        holder = null;
        return ans;
    }
    return {seal:seal, unseal:unseal};
}

function cloneMap(m /*: Object*/) /*: Object*/{
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
function deepObjToJSON(obj /*:any*/,
                       idToWebkey /*: (id: Object) => string*/,
                       saver /*: Saver*/) /*: any */
{
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
    var clone /*: any*/= obj instanceof Array  ? [] : {};
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
function argMap(argv /*: Array<string>*/,
                webkeyStringToLive /*: (webkey: string) => any */) /*: Object*/
{
    var args = {};
    var serverIndex;
    for (serverIndex  = 0;
         serverIndex < argv.length && argv[serverIndex].indexOf ("server") < 0;
         serverIndex++) {
        // next arg...
    }
    if (serverIndex === argv.length - 1) {return args;}
    var parseArg = makeParseArg(webkeyStringToLive);
    var command = argv[serverIndex+1];
    var commandArgs /*: Array<string|number|Object>*/ = [];
    argv.splice(serverIndex+2).forEach(function(next, i) {
        commandArgs[i] = parseArg(next);
    });
    args[command] = commandArgs;
    return args;
}

function makeParseArg(webkeyStringToLive /*: (webkey: string) => any */) /*: (string) => any */{
    return parseArg;

    function parseArg(next /*: string*/) {
        if (next.indexOf("#") === 0) {
            return parseFloat(next.substring(1));
        } else if (next.indexOf("@") === 0) {
            return webkeyStringToLive(next.substring(1));
        }
        return next;
    }
}


var self = {
    typeCheck: typeCheck,
    makeUnique: makeUnique,
    valid: valid,
    tvalid: tvalid,
    makeSealerPair: makeSealerPair,
    cloneMap: cloneMap,
    argMap: argMap,
    makeParseArg: makeParseArg,
    deepObjToJSON: deepObjToJSON
};

module.exports = self;
