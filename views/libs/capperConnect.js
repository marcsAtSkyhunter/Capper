/* 
Copyright 2011 Hewlett-Packard Company. This library is free software;
you can redistribute it and/or modify it under the terms of the GNU
Lesser General Public License (LGPL) as published by the Free Software
Foundation; either version 2.1 of the License, or (at your option) any
later version.  This library is distributed in the hope that it will
be useful, but WITHOUT ANY WARRANTY; without even the implied warranty
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.  You should have
received a copy of the GNU Lesser General Public License (LGPL) along
with this library; if not, write to the Free Software Foundation,
Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
Please contact the Hewlett-Packard Company <www.hp.com> for
information regarding how to obtain the source code for this library.
*/

/*global window, XMLHttpRequest, setTimeout, Q  */
function log(text) {console.log(text);}
/**
 * Anonymous function to ensure that, if the user clicks a link to a different
 * object distinguished from the current object only by the credential in
 * the fragment, the window will reload; normally, a browser will not
 * reload just because the fragment has changed.
 * */
(function () {
    "use strict";
    var originalFragment = window.location.hash;
    var checker = function () {
        if (originalFragment !== window.location.hash) {
            window.location.reload();
        } else {
            setTimeout(checker, 500);
        }
    };
    setTimeout(checker, 500);
}());

var CapperConnect = function() { 
    "use strict";
    var makeProxy;
    function deepProxyConvert(obj) {
        if (!obj || typeof obj !== "object") {return obj;}
        for (var key in obj) {
            if (obj[key] && typeof (obj[key]) === "object" ) {
                if (obj[key]["@"]) {
                    obj[key] = makeProxy(obj[key]);                    
                } else {
                    obj[key] = deepProxyConvert(obj[key]);
                }
            }
        }
        return obj;
    }
    makeProxy = function(JSONkey) {
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
                            vowPair.fulfill(deepProxyConvert(ans["="]));
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
            //log("capperconnect.post args: " + data)
            xhr.send(data);
            return vowPair.promise;
        }
        return Object.freeze({
            webkey: JSONkey["@"],
            isProxy: true,
            post: post
        });
    };
    function keyToProxy(keyString) {return makeProxy({"@": keyString});}
    var home = keyToProxy("" + window.location);
    return Object.freeze({
        home: home,
        keyToProxy: keyToProxy
    });
}();
