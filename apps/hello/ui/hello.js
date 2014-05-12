/*global document, CapperConnect, window */
function showGreeting() {
    "use strict";
    CapperConnect.home.post("greet").then(function(ans){
        document.getElementById("greeting").innerHTML += ans;
    }, function(err){document.body.innerHTML += "got err: " + err;});
}
window.onload = showGreeting;