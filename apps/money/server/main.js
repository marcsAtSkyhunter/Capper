/*global require module Map */
"use strict";

var caplib = require("../../../caplib");
var purseMaker = "money.makePurse";
var shareMaker = "shared";
module.exports = Object.freeze({
    makeMint: function(context) {
        return Object.freeze({
            makeCurrency: function() {
                var share = context.make(shareMaker);
                return context.make(purseMaker, share, 1000000);
            }
        });
    },
    makePurse: function(context) {
        var mem = context.state;
        var self;
        self = Object.freeze({ 
            init: function(share, balance) {
                if ("share" in mem) {return;}  //already initialized
                mem.share = share;
                mem.balance = balance;
            },
            balance: function() {return mem.balance;},
            withdraw: function(amount) {
                amount = Math.round(amount);
                if (amount < 0 || amount > mem.balance) {throw "purse.withdraw bad amount";}
                mem.balance -= amount;
                var ans = context.make(purseMaker, mem.share, amount);
                return ans;
            },
            deposit: function(source) {
                source.setZeroer();
                caplib.valid(mem.share.temp.zeroers.has(source), "purse.deposit bad purse");
                var amount = source.balance();
                mem.balance += amount;
                mem.share.temp.zeroers.get(source)(); 
                return amount;
            },
            setZeroer: function() {
                if (! ("zeroers" in mem.share.temp)) {mem.share.temp.zeroers = new Map();}
                mem.share.temp.zeroers.set(self, function() {mem.balance = 0;});
            }
        });        
        return self;
    }
});


