/*global require describe it console */
var assert = require("assert");
var saver = require("../saver");
var fs = require("fs");
var Q = require("q");
describe ("saver", function() {
    "use strict";
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
        var checkpointOriginalSize = -1;
        var incr, incrId;
        var deferOriginalSize = Q.defer();
        //fs.stat.size seems shockingly unreliable, mysterious
        function vowCapperFileSize() {
            var deferSize = Q.defer();
            function cycle() {
                fs.stat("capper.db", function(err, stats){
                    if (err) {deferSize.reject(err); return;}
                    if (stats.size === 0) {
                        console.log("fs.stats capper.db size zero");
                        cycle();
                    } else {deferSize.resolve(stats.size);}
                });
            }
            cycle();
            return deferSize.promise;
        }
        saver.checkpoint().then(function(ok){
            var vowSize = vowCapperFileSize();
            vowSize.then(function(size){
                checkpointOriginalSize = size;
                try {
                    assert(checkpointOriginalSize >= 2, "checkpoint exists");                
                } catch (err2) {done(err2);}
                deferOriginalSize.resolve(vowSize);
            });
        });
        var vowBadMethod = deferOriginalSize.promise.then(function(originalSize){
            incr = saver.make("incr");
            incrId = saver.asId(incr);
            return saver.deliver(incrId, "badmethod", []);
        });         
        var vowDidBadMethod = vowBadMethod.then(function() {
            done("badmethod not caught");},
            function(err){
                if(err.indexOf("badmethod") < 0) {done("poor badmethod err");}
                return true;
            });
        var vowNewInc = vowDidBadMethod.then(function() {
            return saver.deliver(incrId, "incr");});
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
