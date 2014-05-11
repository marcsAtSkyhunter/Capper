/*global console */

module.exports = function Shop(context) {
    "use strict";
    var mem = context.state;
    mem.sold = mem.sold || 0;
    return Object.freeze({
        initCashRegister: function(purse) {
            if (!mem.register) {mem.register = purse;}
        },
        buyCookies: function(purse) {
            var amountPaid = mem.register.deposit(purse);
            //sell one cookie for 3 credits
            var cookiesBought = Math.floor(amountPaid/3);
            mem.sold += Math.floor(amountPaid/3);
            return cookiesBought;
        },
        cookiesSold: function() {return mem.sold;}
    });
};


