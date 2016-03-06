/*global require, describe, it, console */
var assert = require("assert");
var saver = require("../saver");
describe ("hello", function() {
    "use strict";
    it("setGetGreeting ", function() {
        var hello = saver.make("hello");
        hello.setGreeting("TestHello");
        assert(hello.greet() === "TestHello",
            "Set Greeting matches Retrieved Greeting");
        saver.drop(saver.asId(hello));
    });
});
