/*global require module Map */
"use strict";

var caplib = require("../../../caplib");
module.exports = Object.freeze({
    makeSealerPair: function(context) {
        return Object.freeze({
            makeSealerPair: function() {
                var share = context.make("shared");
                var sealer = context.make("sealer.makeSealer", share);
                var unsealer = context.make("sealer.makeUnsealer", share);
                return {sealer: sealer, unsealer: unsealer};
            }
        });
    },
    makeSealer: function(context) {
        var mem = context.state;
        var self;
        self = Object.freeze({ 
            init: function(share) {
                if ("share" in mem) {return;}  //already initialized
                mem.share = share;
            },
            seal: function(x) {
                var box = caplib.unique();
                mem.share.state[box] = x;
                return box;
            }
        });        
        return self;
    },
    makeUnsealer: function(context) {
        var mem = context.state;
        var self;
        self = Object.freeze({ 
            init: function(share) {
                if ("share" in mem) {return;}  //already initialized
                mem.share = share;
            },
            unseal: function(box) {                
                var x = mem.share.state[box];
                // delete mem.share.state[box]  //uncomment to create an open-only-once unsealer
                return x;
            }
        });        
        return self;
    }
});