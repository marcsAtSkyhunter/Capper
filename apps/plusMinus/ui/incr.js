/*global document, CapperConnect, window, alert */
"use strict";
function elem(id){return document.getElementById(id);}
function increment() {
    CapperConnect.home.post("increment").then(function() {
        alert("made it")
       elem("status").innerHTML += "...counter incremented..."; 
    }, function(err){alert(err);});
}
   