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
				} else {callback(ans)}
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
function increment() {
    poster.post("incr", [], function(x) {alert("new value " + x);});
}