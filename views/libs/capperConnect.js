/*global window, XMLHttpRequest, Q  */
var CapperConnect = function() { 
    "use strict";
    function makeProxy(JSONkey) {
        //"use strict";
        var keyparts = JSONkey["@"].split("#s=");
        var cred = keyparts[1];
        var domain = keyparts[0];
        function post(method, optArgs) {
            var args = [];
            for (var i = 1; i < arguments.length; i++) {
                if (arguments[i].isProxy ) {
                    args.push({"@":arguments[i].webkey});
                } else {args.push(arguments[i]);}     
            }
            var vowPair = Q.defer();
            var xhr = new XMLHttpRequest();
            var target = domain + "?s=" + cred + "&q=" + method ;
            xhr.onreadystatechange=function(){
                if (xhr.readyState !== 4) {return;}
                if (xhr.status===200){
                    try {
                        var ans = JSON.parse(xhr.responseText);
                        if ("=" in ans) {
                            vowPair.fulfill(ans["="]);
                        } else if ("!" in ans) {
                            vowPair.reject(ans["!"]);		
                        }else if ("@" in ans){
                            vowPair.fulfill(makeProxy(ans));                        
                        } else {
                            vowPair.reject(
                                "invalid response not capper/waterken protocol");                        
                        }                    
                    } catch (err) {vowPair.reject("bad response: " + xhr.responseText);}
                } else {vowPair.reject("post failed status " + xhr.status);}
            };
            xhr.open("POST", target, true);
            xhr.setRequestHeader("Content-Type","text/plain");
            var data =  JSON.stringify(args);
            xhr.send(data);
            return vowPair.promise;
        }
        return Object.freeze({
            webkey: JSONkey["@"],
            isProxy: true,
            post: post
        });
    }
    function keyToProxy(keyString) {return makeProxy({"@": keyString});}
    var home = keyToProxy("" + window.location);
    return Object.freeze({
        home: home,
        keyToProxy: keyToProxy
    });
}();
