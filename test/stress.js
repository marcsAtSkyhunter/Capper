/*global require, describe, it, console */
var assert = require("assert");
var saver = require("../saver");
describe ("checkpoint sequentiality", function() {
    "use strict";
    it("abcd testing ", function() {        
        var hello = saver.make("hello");
        hello.setGreeting("TestHello");
        assert(hello.greet() === "TestHello", 
            "Set Greeting matches Retrieved Greeting");
        saver.drop(saver.asId(hello));
    });
});