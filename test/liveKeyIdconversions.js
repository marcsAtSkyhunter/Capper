/*global require describe it console */
var assert = require("assert");
var saver = require("../saver");
var fs = require("fs");
var caplib = require("../caplib");
describe ("liveKeyIdconversions", function() {
    "use strict";
    it("deepObjToJSON", function(){
        function idToWebkey(id) {return "localhost/ocaps/#s=" + saver.idToCred(id);}
        var toJ = caplib.deepObjToJSON;
        assert(toJ("a", idToWebkey, saver) === "a", "string pass through");
        assert(toJ(1, idToWebkey, saver) === 1, "num pass through");
        assert(toJ(function(){}, idToWebkey, saver) === null, "functions nulled");        
        var incr = saver.make("incr");
        var incrId = saver.asId(incr);
        var cred = saver.idToCred(incrId);
        var webkeyObjString = JSON.stringify(toJ(incr, idToWebkey, saver));
        assert((JSON.parse(webkeyObjString))["@"] === idToWebkey(incrId),
            "persistent obj is @key entry");
        var deepTrouble = {a:1, b:"b", c:incr, d:[2,incr, true], 
            e: {f: incr, g: 3}
        };
        var deepJSON = toJ(deepTrouble, idToWebkey, saver);
        var wkey = idToWebkey(incrId);
        assert(deepJSON.a ===1 & deepJSON.b==="b" ,"basic deepTrouble"); 
        assert (deepJSON.c["@"] === wkey, "simple nested service");
        assert(deepJSON.d[2] === true && deepJSON.d[1]["@"] === wkey,
            "array in deepTrouble");
        assert(deepJSON.e.f["@"] === wkey, "deepest key");
        saver.drop(incrId);
    });
    // var vowNewInc = saver.deliver(incrId, "incr", []);
});