
var q = null
var lib = null
var main = null

function elem(val) {return document.getElementById(val)}

function uniqueId(length) {
   var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
   var ans = "";
   while (ans.length < length) {
      var nextI = Math.floor(Math.random()*10000) % chars.length;
      ans += chars[nextI];
   }
   return ans;
}


function escapeHTML(text) {
    try {
        return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/\"/g, '&quot;')
               .replace(/\'/g, '&#39;')
               //.replace(/\//g, '&frasl;')
    } catch (e){return "xss failure"}
}

function xss(text) {return escapeHTML(text)}

/**
 * para(text) transforms text by first xss-safing it, then
 * replacing 2 newlines with <p>, and 1 newline with <br />
 */
function para(text) {
    text = xss(text);
    text = text.replace(/\n\n/g, "<p>");
    return text.replace(/\n/g, "<br />");
}

function println(txt, color) {
   txt = "" + txt
   if (color === undefined) {color = 'black'}
   var field = elem("printlnarea")
   if (field===null) {
      var el = document.createElement('p')
      var txtn = document.createTextNode(escapeHTML(""))
      el.appendChild(txtn)
      document.body.appendChild(el)
      el.setAttribute("id", "printlnarea")
      field = elem("printlnarea")
   }
   field.innerHTML = field.innerHTML +
        '<span style="color: ' + color + '">' +
        escapeHTML(txt) + '</span><br/> \n'
	console.log(txt)
}

function notNull(x) {return x !== undefined && x !== null;}
function jnode(tag, id, height, width) {
    var node = $(document.createElement(tag));
    if (notNull(id)){node.attr("id", id);}
    if (notNull(height)) {node.css("height", "" + height + "%");}
    if (notNull(width)) {node.css("width", "" + width + "%");}
    return node;
}
function jdiv(id, height, width) {
    var newdiv = jnode("div", id, height, width); //.css("overflow", "auto");
	// newdiv.resize(function () {
		// newdiv.children().each(function(i,x){
         // $(x).resize()
      // });
	// });
    return newdiv;
}
function jspan(id, height, width) {return jnode("span", id, height, width);}
function jrow() {
    var row = jnode("tr");
    for (var i = 0; i <arguments.length; i++) {
        row.append(jnode("td").append(arguments[i]));
    }
    return row;
}
function jtable() {
    var table = jnode("table");
    for (var i = 0; i <arguments.length; i++) {
        var row = jnode("tr");
        $.each(arguments[i], function(j, nextcell){
            row.append(jnode("td").append(nextcell));
        });
        table.append(row);
    }
    return table;
}
function jbutton(id, label, action) {
	var btn = jnode("button", id).button().addClass("buttonS");
	if (label) {btn.text(label);}
	if (action) {btn.click(action);}
	return btn;
}

/*
    given a vow, run the testFunc(answer), which should return true if successful
    meanwhile, after millis time, if no resolution, the message gets printed along with the err
    also, if test func is false, or vow is broken, print message and error
    and if testfunc not included, but gets true, prints untested success
    finally, if testfunc returns true, prints success and message
*/
function catchTimeout(vow, message, millis, testFunc) {
    var resolved = false
    if (vow === null || vow === undefined) {
        println("null vow catchtimeout: " + message, "red")
    } else {
        q.when(vow,
            function(answer) {
                resolved = true
                if (testFunc === undefined) {
                    println("untested success: " + message, "green")
                } else if (testFunc(answer)) {
                    println("Fulfilled and passed test: " + message, "green")
                } else {println("Fulfilled but failed test: " +
                    message + "value: " + JSON.stringify(answer), "red")
                }

            },
            function(err) {
                //println("Err on: " + message + " " + err.toJSONString(), "red")
                println("err on: " + message + " " + JSON.stringify(err), "red")
                resolved = true
            }
        )
    }
    function printTimedOut() {
        if (!resolved) {println("Failed timeout on: " + message, "red")}
    }
    setTimeout(printTimedOut, millis)
}

//Given a text and a link, returns the hypertext string to put in the doc
function showLink(txt,url) {
    var result = "<a href='" + encodeURI(url) + "'>" + txt + "</a>";
    return result
}

function stderr(message) {
    return function(err) {
        println(message + " err: " + err + " asString: " + JSON.stringify(err), "red")
        return q.reject(err)
    }
}

/**
 * Cannot directly send javascript unfulfilled promise for obj in vat A to vat B.
 * Use pipe to send the message with the js promise as an arg:
 * @param act a 0-argument function containing the message send you want
 * with the fulfilled proxyObjVow
**/
/**
function pipe(proxyObjVow, act) {
    return q.when(proxyObjVow, function(po){println(act);return act()}, function(err) {
       println("proxy pipe err: " + JSON.stringify(err), "red")
       return err
     })
}
**/

/**
 * Enables infix notation chaining promise fulfillments
 * Example (note the period at the end of each line):
 * var pr2 = q.defer();
 * topipe(pr2.promise).
 *   pipe(function(x) {print(x);return x+1}).
 *   pipe(function(x){print(x); return x+2}).
 *   pipe(function(x){print(x)});
 * pr2.resolve(4);
**/
/**
function pipe(vow) {
    return {
        pipe: function(fx) {
            return pipe(q.when(vow, fx, function(err){
                    println("pipe err: " + JSON.stringify(err), "red")
                    return err
            }))
        },
        vow: function(fx) {return q.when(vow, fx)}
    }
}
**/

/**
 * Sequences a series of promise resolutions.
 * flist is a list of 1-arg functions
 * ferr is an optional  1-arg function that receives a rejected promise.
 * Beginning with the startVow
 * it invokes the first 1-arg function in flist with startVow's fulfillment,
 * invokes the second with the fulfillment of the result of flist[0],
 * and so on.
 * Returns the promise for the result of the last function in the list
 * If any promise is rejected, invokes ferr
**/
function chain(startVow, flist, ferr) {
    function doNext(xvow, i) {
        if (i < flist.length) {
            var fLocErr = ferr
            if (fLocErr === undefined) {fLocErr = stderr("midchain at " + i)}
            var nextVow = q.when(xvow, flist[i], fLocErr)
            return doNext(nextVow, i+1)
        }
        return q.when(xvow, function(x){return x}, ferr)
    }
    return doNext(startVow,0)
}

function qmain(message, args) {
    if (args === undefined) {
        return q.post(main, message)
    }
    return q.post(main, message, args)
}

/**
  * Process a list of promises, return promise for result
  * @param vowList a list of vows
  * @param eachAct an optional function to execute for each vow as it is fulfilled. The
  *    function can accept up to 3 arguments:
  *     the fullfilled value, the current accumulated result, and the resolver
  *     for the overall gather process. For the first
  *     fulfilled vow, the accumulator has value undefined. For vow fulfillment n+1,
  *     the accumulator has the value returned
  *     by the eachAct (or errAct) function for vow resolution  n.
  *     The resolver can be used at any time to short circuit the gather processing.
  *     Once resolved, no more side effects are created by resolution of promises
  *     By default (if eachAct is null or undefined) carries the accumulator forward
  * @param errAct an optional function to execute for each vow as it is rejected. Like
  *     eachAct, can accept 3 arguments, by default (errAct null or undefined),
  *     the returned value carries the accumulator forward.
  * @param finalAct an optional function to execute after all vows have been resolved. The
  *      value returned by finalAct is the fulfillment for the promise returned by the
  *      gather function. finalAct can
  *      accept 1 argument, the accumulator. By default (finalAct null or undefined)
  *      fulfills the gather promise with the accumulator value
  * @return a promise to be resolved with the value returned by finalAct
  *
  * Example 1: async or
  * function asyncOr(vows) {
        return gather(vows, function(x, stub, res) {
           if(x) {res(true)}
        }, null, function() {return false})
     }

  * Example 2: async and
  * function asyncAnd(vows) {
        return gather(vows, function(x, stub, res) {
           if (!x) {res(false)}
        }, function(err, stub, res) {
           res(false)
        }, function() {return true})
     }

  * Example 3: sum values
  * function sum(vows) {
        return gather (vows, function(x, accum) {
           if (accum === undefined) {return x}
           return accum + x
        }, null, function(accum) {return accum})
     }
  **/
function gather(vowList, eachAct, errAct, finalAct) {
    function noVal(x) {return x === undefined || x=== null}
    if (noVal(eachAct)) {eachAct = function(x, a, r){return a}}
    if (noVal(errAct)) {errAct = function(x, a, r){return a}}
    if (noVal(finalAct)) {finalAct = function(a){return a}}
    var pr = q.defer()
    var accum
    var numresolved = 0
    var isFinished = false
    function tryfinish() {
        if (numresolved < vowList.length) {return}
        if (!isFinished) {isFinished = true; pr.resolve(finalAct(accum))}
    }
    // tryfinish in case vowlist.length === 0
    tryfinish()
    function doAct(x, act) {
        numresolved++
        if (!isFinished) {
            try{accum = act(x, accum, pr.resolve)} catch(e){}
        }
        tryfinish()
    }
    for (i = 0; i < vowList.length; i++) {
        q.when(vowList[i], function(x) {
            doAct(x, eachAct)
        }, function(err) {
            doAct(err, errAct)
        })
    }
    return pr.promise
}

/**
 *function msgdlg receives a text message and displays it in a nonmodal jquery dialog
 *to use it, first execute makeMsgDlg() in your ui
 *this is not instantiated by default just in case jquery is not included, since it
 * would throw an exception if jquery were not present
 **/
var msgdlg
function makeMsgDlg() {
    var messager = $('<div></div>')
        .html('Please name the Topic')
        .dialog({
            autoOpen: false,
            title: 'Message'
            });
    msgdlg = function(msg) {
        messager.html(para(msg));
        messager.dialog('open'); return false;
    }
}

(function () {
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

function stringToRef(webkeystring) {return lib.web._ref(null, webkeystring)}
function refToString(ref) {return lib.web._url(ref)}

function isa(value, type) {
    if (!value) { return false; }
    if (!ADSAFE.isArray(value['class'])) { return false; }
    for (var i = 0; i !== value['class'].length; i += 1) {
        if (value['class'][+i] === type) { return true; }
    }
    return false;
}

function makeDisplayer() {
    var displayChoices = []
    var displayer = {
        add: function(classPath, displayFunc) {
            displayChoices.push({path: classPath, dispFn: displayFunc})
        },
        show: function(mainClass) {
            // search from newest to oldest, i.e., from most specific
            // to most generic. in particular, avoid showing the Revoker
            // interface if a more specific class implementing Revoker is
            // available
            for (var i = displayChoices.length-1; i >= 0; i--) {
                var next = displayChoices[i];
                if (isa(mainClass, next.path)) {
                    next.dispFn();
                    return true;
                }
            }
            //document.title="Unidentified clusterken project object"
            //alert("this url assigned to unidentified object" +
            //    JSON.stringify(mainClass))
            return false;
        }
    }
    return displayer
}
var displayer = makeDisplayer()

displayer.add("com.hp.quickdev.QuickDev-X", function(){showQuickDev()});
displayer.add("com.hp.quickdev.WkenValidator-X", function(){showWkenValidator()});
displayer.add("com.hp.farfile.FarFileX", function(){showFarFile()});
displayer.add("com.hp.quickdev.Scriptor", function(){showScriptor()});


function doMain(theLib) {
    lib = theLib
    q = lib.Q
    main = lib.web.getLocation()
    //used to be q.when(main, ... but I think this is the required new form
    q.when(q.get(main), function(mainClass) {
        if (displayer.show(mainClass)) {
            // displayer found the class
        } else if (isa(mainClass, "com.hp.elastic.NodeBoss")) {
            showBoss()
        } else if (isa(mainClass, "com.hp.elastic.VatMaker")) {
            showMaker()
        } else if (isa(mainClass, "com.hp.clusterken.tutorial.ClusterFacX")) {
            showFac()
        } else if (isa(mainClass, "com.hp.clusterken.tutorial.ClusterFacExtX")) {
            showFac()
        } else if (isa(mainClass, "com.hp.clusterken.tutorial.CookieShop")) {
            showCookieShop()
        } else if (isa(mainClass, "com.hp.clusterken.tutorial.Purse")) {
            showPurse()
        } else if (isa(mainClass, "org.waterken.tutorial.CookieShop")) {
            showCookieShop()
        } else if (isa(mainClass, "org.waterken.tutorial.PurseX")) {
            showPurse()
        } else if (isa(mainClass, "org.waterken.tutorial.Purse")) {
            showPurse()
        } else if (isa(mainClass, "com.hp.quickdev.FarShell")) {
            showShell()
        } else if (isa(mainClass, "com.hp.quickdev.LimitedShell")) {
            showLimited()
        } else if (isa(mainClass, "com.hp.clusterken.pubsub.Admin")) {
            showAdmin()
        } else if (isa(mainClass, "com.hp.clusterken.pubbatch.Admin")) {
            showAdmin()
        } else if (isa(mainClass, "com.hp.clusterken.pubsub.EventRcvr")) {
            showEventRcvr()
        } else if (isa(mainClass, "com.hp.clusterken.pubbatch.EventRcvr")) {
            showEventRcvr()
        } else if (isa(mainClass, "com.hp.clusterken.pubsub.SubscriberAgent")) {
            showSubscriber()
        } else if (isa(mainClass, "com.hp.clusterken.pubbatch.SubscriberAgent")) {
            showSubscriber()
        } else if (isa(mainClass, "com.hp.pipe.Revoker")) {
            showRevoker()
        } else if (isa(mainClass, "com.hp.clusterken.casino.Casino")) {
            showCasino()
        } else if (isa(mainClass, "com.hp.clusterken.casino.CasinoMaker")) {
            showCasinoMaker()
        } else {
            //displayer.show(mainClass);
        }
    }, stderr("broken promise for class for page"))
}




