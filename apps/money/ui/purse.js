/*global window XMLHttpRequest  */
function makePoster() {
    //"use strict";
    var cred = ("" + window.location).split("#s=")[1];
    var domain = ("" + window.location).split("#s=")[0];
    function post(method, args, callback) {
        var xhr = new XMLHttpRequest();
        var target = domain + "?s=" + cred + "&q=" + method ;
        xhr.onreadystatechange=function(){
            if (xhr.readyState !== 4) {return;}
            if (xhr.status===200){
				var ans = JSON.parse(xhr.responseText);
				if ("=" in ans) {
					callback(ans["="]);
				} else {callback(ans);}
            } else {alert("post failed status " + xhr.status);}
        };
        xhr.open("POST", target, true);
        xhr.setRequestHeader("Content-Type","text/plain");
        var data =  JSON.stringify(args);
        xhr.send(data);
        
    }
    return Object.freeze({
        cred:cred,
        post: post
    });
}
var poster = makePoster();
function showBalance() {
	poster.post("balance", [], function(amount) {
        document.getElementById("balance").innerHTML = amount;
	});
}
setTimeout(showBalance, 1000);
function withdraw() {
    var amountstring = document.getElementById("withdrawamount").value;
    if (amountstring.length === 0 ) {alert("must have number"); return;}
	var amount = parseInt(amountstring);
    poster.post("withdraw", [amount], function(x) {
        document.getElementById("newpurse").innerHTML =
            "<a href=" + x["@"] + " >Purse_" + amount + "</a>";
        showBalance();
    });
}
function deposit() {
    var pursekey = document.getElementById("depositwebkey").value;
    document.getElementById("depositwebkey").value = "";
    var ref= {"@": pursekey};
    poster.post("deposit", [ref], function(amount){
        document.getElementById("depositamount").innerHTML = "Deposited: " + amount;
        showBalance();
    });
}