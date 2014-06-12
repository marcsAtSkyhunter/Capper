/*global console */

/**
* PlusMinus creates a service with 3 interwoven mini-services, each
* mini-service a single object. The 3 objects allow you to increment a
* counter, decrement the counter, and read the counter.
*
* For example, suppose you have Alice, Bob, and Carol
* working together. Alice wants to see if there are more blue cars
* driving down the highway than red cars. She wants Bob to increment a
* a counter each time he sees a blue car, and she wants Carol to decrement
* the counter each time she sees a red car. If the counter>0 at any time,
* more blue cars have passed; if the counter<0, more red cars have
* passed.
*
* So Alice creates a plus/minus
* service with 3 webkeys: the root plus/minus object, the incrementer,
* and the decrementer.
*
* The root holds the
* webkeys for both the incrementer and the decrementer, and also has the method
* that allows the webkey holder (Alice) to read
* the current count. Alice gives the incrementer webkey to Bob,
* and the decrementer webkey to Carol.
*
* Because of the nature of the fine grain access via the webkeys, Bob
* can only increment, he can neither decrement nor see the current count.
* Carol can similarly only decrement.
* */
module.exports = function PlusMinus() {
    "use strict";
    function makeRoot(context) {
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
            increment: function() {++mem.counter.state.count;}
        });
    }
    function makeMinus(context) {
        var mem = context.state;
        return Object.freeze({
            init: function(sharedCounter) {
                if (!mem.counter) {mem.counter = sharedCounter;}
            },
            increment: function() {--mem.counter.state.count;}
        });
    }

    return Object.freeze({
        makeRoot: makeRoot,
        makePlus: makePlus,
        makeMinus: makeMinus
    });
}();