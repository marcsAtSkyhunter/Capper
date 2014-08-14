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

var CapperLayout = {
    /**
     * Do substitutions on a block of text to prevent XSS attacks
     * */
    xss: function(text) {
        try {
            return text.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/\"/g, '&quot;')
                   .replace(/\'/g, '&#39;');
                   //.replace(/\//g, '&frasl;')
        } catch (e){return "xss failure";}
    },
    jnode: function(tag, width, height) {
        var node = $(document.createElement(tag));
        if (height) {node.css("height", "" + height + "%");}
        if (width) {node.css("width", "" + width + "%");}
        return node;
    },
    jdiv: function(width, height) {
        var newdiv = CapperLayout.jnode("div", width, height); //.css("overflow", "auto");
        return newdiv;
    },
    jspan: function(width, height) {return CapperLayout.jnode("span", width, height);},
    jrow: function(etcetera) {
        var row = CapperLayout.jnode("tr");
        for (var i = 0; i <arguments.length; i++) {
            row.append(CapperLayout.jnode("td").append(arguments[i]));
        }
        return row;
    },
    jtable: function(etcetera) {
        var table = CapperLayout.jnode("table");
        for (var i = 0; i <arguments.length; i++) {
            var row = CapperLayout.jnode("tr");
            $.each(arguments[i], function(j, nextcell){
                row.append(CapperLayout.jnode("td").append(nextcell));
            });
            table.append(row);
        }
        return table;
    },
    jbutton: function (label, action) {
        var btn = CapperLayout.jnode("input").attr("type", "button");
        if (label) {btn.val(label);}
        if (action) {btn.click(action);}
        return btn;
    },
    jbr: function(){return CapperLayout.jnode("br");}
};

/**
 * para(text) transforms text by first xss-safing it, then
 * replacing 2 newlines with <p>, and 1 newline with <br />
 */
function para(text) {
    text = CapperLayout.xss(text);
    text = text.replace(/\n\n/g, "<p>");
    return text.replace(/\n/g, "<br />");
}

function println(txt, color) {
   txt = "" + txt;
   if (color === undefined) {color = 'black';}
   var field = elem("printlnarea");
   if (field===null) {
      var el = document.createElement('p');
      var txtn = document.createTextNode(CapperLayout.xss(""));
      el.appendChild(txtn);
      document.body.appendChild(el);
      el.setAttribute("id", "printlnarea");
      field = elem("printlnarea");
   }
   field.innerHTML = field.innerHTML +
        '<span style="color: ' + color + '">' +
        CapperLayout.xss(txt) + '</span><br/> \n';
	console.log(txt);
}

function stderr(message) {
    return function(err) {
        println(message + " err: " + err + " asString: " + JSON.stringify(err), 
            "red");
        throw err;
    };
}



