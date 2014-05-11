/*global require describe it console */
"use strict";
var assert = require("assert");
var saver = require("../saver");
var fs = require("fs");
describe ("saver", function() {
    it("shared object ", function() {        
        var shared = saver.make("shared");
        shared.state.x = "testdata";
        assert(shared.state.x === "testdata", " test shared state ");
        try {
            shared.state.fn = function(){};
            assert(false, "did not reject permanent store of function");
        } catch (err) {
            assert(true, "correctly rejected permanent store of function");
        }
        var objId = saver.asId(shared);
        var objFromId = saver.live(objId);
        assert(objFromId === shared, "shared via id match original");
        saver.drop(objId);
        assert(saver.live(objId) === null, 
            "objId for shared obj dropped, no longer valid");
    });
    it("clearLive ", function(){        
        var shared = saver.make("shared");
        shared.state.x = "testdata";
        var shareId = saver.asId(shared);
        saver.clearLive();
        var revivedShare = saver.live(shareId);
        assert(revivedShare.state.x === "testdata", "revived share same state");
        assert(revivedShare !== shared, "revived share not same referenced object");
        saver.drop(shareId);
    });
    it("saver reloaded, test checkpointing", function(done){
        var checkpointOriginalSize = fs.statSync("capper.db").size;
        assert(checkpointOriginalSize > 2, "checkpoint exists");
        var incr = saver.make("incr");
        var incrId = saver.asId(incr);
        var vowBadMethod = saver.deliver(incrId, "badmethod", []);
        vowBadMethod.then(function() {done("badmethod not caught");},
            function(err){
                if(err.indexOf("badmethod") < 0) {done("poor badmethod err");}
            });
        var vowNewInc = saver.deliver(incrId, "incr", []);
        var vowDroppedIncrCheckpointed = vowNewInc.then(function(incVal){
            assert(incVal === 1, "increment incremented to 1");
            var checkpointWithIncrSize = fs.statSync("capper.db").size;
            assert(checkpointWithIncrSize > checkpointOriginalSize,
                "checkpoint with incr is larger"); 
            saver.drop(incrId);
            return saver.checkpoint();
        });
        vowDroppedIncrCheckpointed.then(function(ok){
            var checkpointFinalSize = fs.statSync("capper.db").size;
            console.log("sizes " + checkpointOriginalSize + " "  + checkpointFinalSize)
            try {
                assert(checkpointOriginalSize === checkpointFinalSize, 
                    "checkpoint final size matches original size");
                done();
            } catch (err) {done(err);}
        }, function (err){
            //assert(false, "checkpoint promise rejected: " + err); 
            done("checkpoint promise rejected: " + err);
        });
    });
});