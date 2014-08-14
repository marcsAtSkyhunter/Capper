/*global document, console, CapperConnect, window, alert, makeDelegationMgr, $ */
"use strict";
function log(text) {console.log(text);}
function elem(id){return document.getElementById(id);}
function collectData(originalData) {
    var newData = {};
    for (var next in originalData) {
        var field = elem(next);
        if (field) {
            newData[next] = field.value;             
        } //else {newData[next] = "";} 
    }
    return newData;
}
function makeDataTable(ordering, data) {
    var row = "<tr><td>$label</td><td><input id='$id' value='$value' /></td></tr>";
    var div = "<table>";
    ordering.forEach(function(next) {
        var nextElem = row.replace("$label", next).replace("$id", next).
            replace("$value", data[next]);
        div += nextElem;
    });
    div += "</div>";
    return div;
}
var cachedData;
function show() {
    CapperConnect.home.post("data").then(function(data) {
        cachedData = data;
        var ordering = ["Name", "PhoneNumber",
            "DateOfBirth", "Street", "City", "State", "ZipCode"];
        var dataDiv = makeDataTable(ordering, data);
        elem("fields").innerHTML = dataDiv;
        elem("title").innerHTML = "Person";
        var mgr = makeDelegationMgr();
        log("mgr " + mgr);
        $(document.body).append(mgr.div); 
    }, function(err){alert(err);});
}
function update() {
    elem("status").innerHTML = "Updating...";
    var newData = collectData(cachedData);
    CapperConnect.home.post("setData", newData).then(function(ok){
        elem("status").innerHTML = "Update Complete";
    }, function(err){elem.status.innerHTML = "Update error: " + err;});
}
   
window.onload = function() {
    elem("update").onclick = update;
    show();
};