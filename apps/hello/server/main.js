/*global console */

module.exports = function Hello(context) {
    "use strict";
    context.state.greeting = context.state.greeting || "Hello World";
    return Object.freeze({
        greet: function() {return context.state.greeting;},
        setGreeting: function(greeting) {context.state.greeting = greeting;}
    });
};


