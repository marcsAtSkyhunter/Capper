/*global document, CapperConnect, window */
"use strict";

function showGreeting() {
    CapperConnect.home.post("greet").then(function(ans){
        document.body.innerHTML += ans;
    }, function(err){document.body.innerHTML += "got err: " + err;});
}

window.onload = showGreeting;