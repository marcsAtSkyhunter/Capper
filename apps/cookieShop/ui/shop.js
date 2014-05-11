/*global document, CapperConnect, console, window */
"use strict";

function log(text){console.log(text);}
function elem(id) {return document.getElementById(id);}
function showShop() {
    CapperConnect.home.post("cookiesSold").then(function(amount){
         elem("cookiesSold").innerHTML = "" + amount;
    }, function(err){document.body.innerHTML += "got err: " + err;});
}

function initCashRegister() {
    var webkey = elem("register").value;
    var register = CapperConnect.keyToProxy(webkey);
    CapperConnect.home.post("initCashRegister", register).then(function() {
        document.body.innerHTML += "<p>Cash Register set";
    }, function(err){log("register err " + err);});
}

function buyCookies() {
    var payPurseKey = elem("paypurse").value;
    log(payPurseKey)
    if (payPurseKey.indexOf("https://") !== 0) {
        document.body.innerHTML += 
            "<p> Must put purse webkey in pay field to build cookies";        
    } else {
        var paypurse = CapperConnect.keyToProxy(payPurseKey);
        CapperConnect.home. post("buyCookies", paypurse).then(function(bought) {
            document.body.innerHTML += "Bought " + bought + " Cookies";
            showShop();
        }, function(err){
            document.body.innerHTML += "bad buy: " + err;
        });
    }
}

window.onload = showShop;