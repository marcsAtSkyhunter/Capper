/*global document, CapperConnect, window, alert */
function elem(id){return document.getElementById(id);}
function increment() {
    "use strict";
    CapperConnect.home.post("increment").then(function() {
       elem("status").innerHTML += "...counter incremented..."; 
    }, function(err){alert(err);});
}
   
window.onload = function() {elem("incr").onclick = increment;};