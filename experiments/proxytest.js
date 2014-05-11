/*global Proxy*/

function logForward(target) {
    "use strict";
    var events = "";
    var p = Proxy.create({
        get: function(proxy, name){
            events += "get";
            return target[name];
        },
        set: function(proxy, name, val) {
            events+="set";
            target[name] = val;
        },
        has: function(name) {return name in target;}
        //delete, has, iterate, keys
    });
    return Object.freeze({
        proxy: p,
        events: function() {return events;}
    });
}

var map = {};
var ppair = logForward(map);
var pmap = ppair.proxy;
pmap.x = 3;
var output = pmap.x;
function log(text) {console.log(text);}
log(("x" in pmap) + " pmap contains x");
log((ppair.events() === "setget") + " events setget: " + ppair.events());
log((pmap.x === 3) + " pmap has right value");
log((map.x === 3) + " map has right value");