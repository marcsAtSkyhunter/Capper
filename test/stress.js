/*global require, describe, it, console */
var assert = require("assert");
var saver = require("../saver").ezSaver(require).saver;
var Q = require("q");
describe ("checkpoint sequentiality", function() {
    "use strict";
    it("abcd sequential checkpoint stress testing ", function(done) { 
        var sequence = "abcdefghij";
        var sequencers = [];
        var resultVows = [];
        for (var i = 0; i < 10; i++) {
            sequencers.push(saver.make("sequencer"));
        }
        sequencers.forEach(function(v,i) {
            var seqId = saver.asId(sequencers[i]);
            for (var j = 0; j < sequence.length; j++) {
                saver.deliver(seqId, "append", sequence[j]);
                //resultVows.push(saver.deliver(seqId, "content"));
            }
            resultVows.push(saver.deliver(seqId, "content"));
        });
        Q.all(resultVows).then(function(results) {
            results.forEach(function(v, i){
                if (v !== sequence) {done("bad sequence: " + v);}
            });
            sequencers.forEach(function(v,i){
                saver.drop(saver.asId(v));
            });
            done();
        });
    });
});
