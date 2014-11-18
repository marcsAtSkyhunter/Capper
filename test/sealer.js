/*global require describe it console */
"use strict";
var assert = require("assert");
var saver = require("../saver");
describe ("sealer", function() {
    it("seal&unseal ", function() {        
        var shared = saver.make("shared");
        var sealer = saver.make("sealer.makeSealer", shared);
        var unsealer = saver.make("sealer.makeUnsealer", shared);
        var box = sealer.seal(3.14);
        assert(typeof box === "string", "box is a token");
        var contents = unsealer.unseal(box);
        assert(contents === 3.14, "contents of box is correct");
        saver.drop(saver.asId(shared));
        saver.drop(saver.asId(sealer));
        saver.drop(saver.asId(unsealer));
    });
});