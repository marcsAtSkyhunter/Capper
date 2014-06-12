/*global document, CapperConnect, window */
function showRoot() {
    "use strict";
    function elem(id){return document.getElementById(id);}
    function makeLink(name, url) {
        var base = "<a href='$url'>$name</a>";
        return base.replace("$url", url).replace("$name", name);
    }
    function updateCount() {
        CapperConnect.home.post("count").then(function(count){
            elem("count").innerHTML = "" + count;
            setTimeout(updateCount, 5000);
        }, function(err){document.body.innerHTML += "got err: " + err;});
    }
    updateCount();
    CapperConnect.home.post("incrementer").then(function(incr){
        elem("incr").innerHTML = makeLink("Incrementer", incr.webkey);
    });
    CapperConnect.home.post("decrementer").then(function(decr){
        elem("decr").innerHTML = makeLink("Decrementer", decr.webkey);
    });   
        
}
window.onload = showRoot;