/*global document, $, console */
"use strict";

function elem(val) {return document.getElementById(val);}

function uniqueId(length) {
   var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
   var ans = "";
   while (ans.length < length) {
      var nextI = Math.floor(Math.random()*10000) % chars.length;
      ans += chars[nextI];
   }
   return ans;
}

/**
 * Do substitutions on a block of text to prevent XSS attacks
 * */
function xss(text) {
    try {
        return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/\"/g, '&quot;')
               .replace(/\'/g, '&#39;');
               //.replace(/\//g, '&frasl;')
    } catch (e){return "xss failure";}
}


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
   txt = "" + txt;
   if (color === undefined) {color = 'black';}
   var field = elem("printlnarea");
   if (field===null) {
      var el = document.createElement('p');
      var txtn = document.createTextNode(xss(""));
      el.appendChild(txtn);
      document.body.appendChild(el);
      el.setAttribute("id", "printlnarea");
      field = elem("printlnarea");
   }
   field.innerHTML = field.innerHTML +
        '<span style="color: ' + color + '">' +
        xss(txt) + '</span><br/> \n';
	console.log(txt);
}

function notNull(x) {return x !== undefined && x !== null;}
function jnode(tag, width, height) {
    var node = $(document.createElement(tag));
    if (notNull(height)) {node.css("height", "" + height + "%");}
    if (notNull(width)) {node.css("width", "" + width + "%");}
    return node;
}
function jdiv(width, height) {
    var newdiv = jnode("div", width, height); //.css("overflow", "auto");
	// newdiv.resize(function () {
		// newdiv.children().each(function(i,x){
         // $(x).resize()
      // });
	// });
    return newdiv;
}
function jspan(width, height) {return jnode("span", width, height);}
function jrow(etcetera) {
    var row = jnode("tr");
    for (var i = 0; i <arguments.length; i++) {
        row.append(jnode("td").append(arguments[i]));
    }
    return row;
}
function jtable(etcetera) {
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
function jbutton(label, action) {
	//var btn = jnode("button", id).button().addClass("buttonS");
    var btn = jnode("input").attr("type", "button");
	if (label) {btn.text(label);}
	if (action) {btn.onclick(action);}
	return btn;
}

function stderr(message) {
    return function(err) {
        println(message + " err: " + err + " asString: " + JSON.stringify(err), 
            "red");
        throw err;
    };
}

/**
 *function msgdlg receives a text message and displays it in a nonmodal jquery dialog
 *to use it, first execute makeMsgDlg() in your ui
 *this is not instantiated by default just in case jquery is not included, since it
 * would throw an exception if jquery were not present
 **/
var msgdlg;
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
    };
}
