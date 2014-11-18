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

/*global require  */

var Q = require("q");
var caplib = require("./caplib");
var makeProxy = require("./remoteProxy");
function log(text) {console.log(text);}

var commandArgs = [];
var target; //proxy to be identified as first arg to command
process.argv.forEach(function(next, i) {
    if (i === 0 || (i === 1 && next === "--harmony") || next.indexOf("remoteCall") > 0) {
        //skip
    } else if (!target && next[0] !== "@"){
        throw "Must have target object webkey, prefixed with @, as first arg";
    } else if (next.indexOf("#") === 0) {
        var num = parseFloat(next.substring(1));
        commandArgs.push (num);
    } else if (next.indexOf("@") === 0) {
        if (!target) {
            target = makeProxy(next.substring(1));        
        } else {
            commandArgs.push(makeProxy(next.substring(1)));
        }
    } else {commandArgs.push(next);}
});
log(commandArgs)
if (!target || commandArgs.length ===0) {
    log("remoteCall invokes a method on an object on a capper server. A call");
    log("has form: node --harmony remoteCall @targetWebkey method arg1 arg2 arg3");
    log("in which targetWebkey is the object to call, method is the method to invoke.");
    log("If an arg is numeric, prefix it with #, if it is an invocable object,");
    log("prefix it with @.");
} else {
    target.post.apply(null, commandArgs).then(
        function(ans) {
            log("" + ans);
            if (typeof ans === "object") {log(JSON.stringify(ans));}
        },
        function(err) {log("Error: " + err);}
    );
}

