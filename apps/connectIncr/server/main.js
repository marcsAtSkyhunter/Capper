/*global console */

module.exports = function Incr(context) {
    "use strict";
    context.state.x = context.state.x || 0;
    return Object.freeze({
        incr: function() {return ++context.state.x;}
    });
};


