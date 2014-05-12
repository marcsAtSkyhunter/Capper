###Capper
Capper is a web application framework built on Node.js/Express (with Q.js for promises) that implements object capability security using unguessable urls (i.e., _webkeys_) for access control. Persistence of exportable objects (which behave like individual small services) is automated, and a webkey is associated with each such persistent exportable object at creation.

By using webkeys for access control, Capper makes it quick and easy to build applications for which people do not need usernames or passwords: they just bookmark the link to the object, and to access the object they just click the link and go to work. As explained in the YouTube video at https://www.youtube.com/watch?v=C7Pt9PGs4C4, it can be reasonably argued that such webkey based access control is at least as secure as using passwords. 

Webkeys also make it easier to enable _rich sharing_ wherein each participant in the handling of a resource gets as much authority as he needs and no more. See the video on Rich Sharing at https://www.youtube.com/watch?v=T92ZboMsH1w to learn about key features of sharing that are common in the physical world but very rare on the web. And the 2Click Sharing video at https://www.youtube.com/watch?v=cJThfgXMBA4 briefly shows a whole online desktop system entirely built with webkeys that enables such rich sharing.

Capper uses the same webkey protocol that the Waterken Java-based platform uses for browser/server communication. You can read more about webkeys, their virtues and their implementation, at http://waterken.sourceforge.net/
####Capper First Steps
Install node.js, Express, and Q; Express and Q are conveniently installed with npm:
>npm -g install express

>npm -g install q

Download the Capper directory as a zip file and unpack it. If you are a mocha user, you may want to run the included tests to make sure the installation worked properly. Capper requires the harmony JavaScript extensions, so go into the Capper directory and execute
>mocha --harmony

Next, you will need to modify the capper.config file to suit your needs. To conduct client-server testing on your development machine, you probably want to set "domain" to "localhost". Select a port you can open on your machine (beware of firewalls blocking ports, you may have to configure the firewall as well). At this time you must use protocol https. The self-signed certificate embodied in the "ssl" folder will be adequate for simple testing, though you will have to click OK through the cert monolog boxes.

In a command window, change directories to the Capper folder and startup the server from the command line with
>node --harmony server

Now in the browser go to page 
>https://localhost:1341/

(replace "1341" with your port number) which should pop you to the Capper Home page; this page can be edited in the Capper/views/index.html file.

####Create A New HelloWorld Service
To create a private hello world page, accessible only by you, shut down the server and type the command
>node --harmony server -make hello

This should print out a url that is a private unguessable url, it should look something like this:
>https://localhost:1341/ocaps/#s=Vs6Q6ofuVL_DzzqoYe8cEuO

The part after the "#s=" is the cryptographically strong and unguessable credential. This url refers to a new private Hello World page. Turn on the server again, go to your url, and you should see it. Bookmark the url if you want to go back to see it again later.

You can destroy a service with the "drop" command using the credential. For the example service above, you would destroy it by shutting down the server and executing
>node --harmony server -drop Vs6Q6ofuVL_DzzqoYe8cEuO

####Create Your Own HelloGalaxy Service
Now we will start developing code. Capper allows you to put many applications on a single server, each application having many different kinds of objects/services. Each application is given its own folder in the Capper/apps directory. Each app has a server subfolder, and a ui subfolder. The server subfolder always has a file main.js; the ui folder usually has a file index.html.

For the HelloGalaxy application, create the file Capper/apps/helloGalaxy/server/main.js. Edit main.js to hold the following code:

```javascript
module.exports = function HelloGalaxy(context) {
    "use strict";
    return Object.freeze({
        greet: function() {return "Hello Galaxy";}
    });
};
```

This first version of HelloGalaxy has a single method "greet" that always returns the same "Hello Galaxy" value. 

Note that the HelloGalaxy function that makes HelloGalaxy services receives a "context" as an argument. Among other things, the context's "state" property stores the persistent data associated with a particular instance of the service type, as we will see later.

Create a new HelloGalaxy service as we did Hello earlier:
>node --harmony server -make helloGalaxy

We have not yet built a user interface for HelloGalaxy, but you can interact with it from the command line. Using the webkey created in the previous step, 
>node --harmony server -post @webkey greet

On this command line, the webkey is prefixed with "@" to indicate it should be interpreted as a reference to an object. The first argument for a -post command is always the target object to receive the message. The second word, "greet", is the name of the method to invoke. Additional arguments are used as arguments in the method invocation. 

Invoking the object with -post should return a result similar to
>{"=":"Hello Galaxy"}
which is the JSON format of the returned value sent to the client.

Next lets create a very simple web page to display the new service in the browser. In Capper/apps/HelloGalaxy/ui/index.html, put the following web page:
```html
<html><head>
<meta referrer="never" />
<title>Hello Galaxy</title>
</head>
<body><h2>Howdy</h2></body>
</html>
```

This version of the page will not even invoke our object to see what the greeting should really be, but it should be good enough to give us a simple display. Click the webkey in your browser, and confirm you now get a page representing our HelloGalaxy object.

Please note the meta referrer=never tag in our page. You should always include this header when using webkeys. While the webkeys used by Capper, which place the credential in the fragment, are generally safe from being revealed via the referer header in most browsers, it is safer to explicitly request that the referer header be shut off.

To actually invoke our object with the "greet" method, get back the answer, and use it to display the actual Hello Galaxy greeting, we need to communicate with our resource using the Waterken protocol for webkey systems. A simple wrapper library for this protocol that allows us to make object invocations rather than fiddling ourselves with xhr requests can be found in capperConnect.js, which is included in the distribution under Capper/views/libs.

Upgrade the index.html file to import the Q promise package, CapperConnect, and a javascript file that contains the Hello Galaxy executable:
```html
<html>
<head>
<meta name="referrer" content="never">
<title>Hello Galaxy</title>
<script type="text/javascript" src="/views/libs/q.js"></script>
<script type="text/javascript" src="/views/libs/capperConnect.js"></script>
<script type="text/javascript" src="/apps/helloGalaxy/ui/hello.js"></script>
</head>
<body>
<h3 id="greeting"></h3>
</body>
</html>
```
Note that the h3 header that should contain the greeting now has an id, but no longer has an actual value inside. Our javascript will get the actual greeting from the server and put that into the header, using the id to find the place to insert it.

Create the file apps/helloGalaxy/ui/hello.js and put in the following code:

```javascript
/*global document, CapperConnect, window */
function showGreeting() {
    "use strict";
    CapperConnect.home.post("greet").then(function(ans){
        document.getElementById("greeting").innerHTML += ans;
    }, function(err){document.body.innerHTML += "got err: " + err;});
}
window.onload = showGreeting;
```
After the window loads, the javascript will use CapperConnect to retrieve the actual greeting from our HelloGalaxy object on the server.

CapperConnect.home is a client-side proxy for the server-side object being presented in the page. It has the method "post", which is given a method name ("greet" in this case) and a series of arguments as appropriate for the method invoked. Posting via the proxy returns a promise (from Q.js) for the answer; when the promise is fulfilled, it fires the "then" method that invokes the function with the answer (if something goes wrong, and the promise gets rejected, the second function fires with the error as the argument).  

