/*global CapperConnect  */

var home = CapperConnect.home;

function increment() {
    home.post("incr", []).then (function(x) {alert("new value " + x);});
}