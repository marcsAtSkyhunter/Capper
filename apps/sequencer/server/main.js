/*global console */

/**
 * Sequencer is used by the mocha tests to exercise the sequentiality
 * of multiple operations on a single object. Each append concatenates
 * some text (usually a single character) to the content string. After
 * a series of such operations one can retrieve the content to assess
 * whether the operations were performed and checkpointed in correct FIFO
 * order.
 * */
module.exports = function Sequencer(context) {
    "use strict";
    context.state.x = context.state.x || "";
    return Object.freeze({
        append: function(c) {context.state.x += c;},
        content: function() {return context.state.x; }
    });
};


