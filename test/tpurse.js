/*global require describe it console */
"use strict";
var assert = require("assert");
var saver = require("../saver").ezSaver(require).saver;
describe ("purse", function() {
    it("withdraw&deposit ", function() {
        var shared = saver.make("shared");
        var shareId = saver.asId(shared);
        var rootPurse = saver.make("money.makePurse", shared, 200000);
        var rootId = saver.asId(rootPurse);
        assert(rootPurse.balance() === 200000, "rootpurse start balance");
        var smallPurse = rootPurse.withdraw(30);
        var smallId = saver.asId(smallPurse);
        assert(smallPurse.balance() === 30 && rootPurse.balance() === 200000-30,
            "post withdraw balances");
        var amount = rootPurse.deposit(smallPurse);
        assert(amount === 30 && rootPurse.balance() === 200000 &&
            smallPurse.balance() ===0,
            "post deposit balances");
        saver.drop(shareId);
        saver.drop(smallId);
        saver.drop(rootId);
    });
});
