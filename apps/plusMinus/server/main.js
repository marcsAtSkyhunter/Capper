/*global console */

module.exports = function PlusMinus() {
    "use strict";
    function makeCounterPair(context) {
        var mem = context.state;
        if (!("incr" in mem)) {
            mem.counter = context.make("shared");
            mem.counter.state.count = 0;
            mem.incr = context.make("plusMinus.makePlus", mem.counter);
            mem.decr = context.make("plusMinus.makeMinus", mem.counter);            
        }
        return Object.freeze({
            incrementer: function() {return mem.incr;},
            decrementer: function() {return mem.decr;},
            count: function(){return mem.counter.state.count;}
        });
    }
    function makePlus(context) {
        var mem = context.state;
        return Object.freeze({
            init: function(sharedCounter) {
                if (!mem.counter) {mem.counter = sharedCounter;}                
            },
            increment: function() {
                return ++mem.counter.state.count;
            }
        });
    }
    function makeMinus(context) {        
        var mem = context.state;
        return Object.freeze({
            init: function(sharedCounter) {
                if (!mem.counter) {mem.counter = sharedCounter;}                
            },
            increment: function() { 
                return --mem.counter.state.count;
            }
        });
    }

    return Object.freeze({
        makeCounterPair: makeCounterPair,
        makePlus: makePlus,
        makeMinus: makeMinus
    });
}();
