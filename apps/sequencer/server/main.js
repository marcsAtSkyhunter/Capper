/*global console */

module.exports = function Sequencer(context) {
    "use strict";
    context.state.x = context.state.x || "";
    return Object.freeze({
        append: function(c) {context.state.x += c;},
        content: function() {return context.state.x; }
    });
};


