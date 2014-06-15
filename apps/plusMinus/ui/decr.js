/*global document, CapperConnect, window, alert */
function elem(id){return document.getElementById(id);}
function decrement() {
    "use strict";
    CapperConnect.home.post("decrement").then(function() {
       elem("status").innerHTML += "...counter decremented..."; 
    }, function(err){alert(err);});
}
   
window.onload = function() {elem("decr").onclick = decrement;};