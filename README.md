###Capper
Capper is a web application framework built on Node.js/[Express](https://github.com/visionmedia/express) (with [Q.js for promises](https://github.com/kriskowal/q)) that implements security using [webkeys](http://waterken.sourceforge.net/web-key/), i.e., unguessable, self-authorizing urls. Persistence of remotely-accessible objects is automated, and a webkey is associated with each such persistent exportable object at creation.

By using webkeys for access control, Capper makes it quick and easy to build applications for which people do not need usernames or passwords: they just bookmark the link to the object they are allowed to use, and to access the object they just click the link and go to work. As explained in the [YouTube video "Webkeys versus Passwords"](https://www.youtube.com/watch?v=C7Pt9PGs4C4), it can be reasonably argued that such webkey based access control is at least as secure as using passwords. 

Webkeys also make it easier to enable [rich sharing](http://www.hpl.hp.com/techreports/2009/HPL-2009-169.pdf) wherein each participant in the handling of a resource gets as much authority as he needs and no more. See the [video on Rich Sharing](https://www.youtube.com/watch?v=T92ZboMsH1w) to learn about key features of rich sharing that are common in the physical world but very rare on the web. And the [2Click Sharing video](https://www.youtube.com/watch?v=cJThfgXMBA4) briefly shows a whole online desktop system entirely built with webkeys that enables such rich sharing.

Capper uses the same webkey protocol that the [Waterken](http://waterken.sourceforge.net/) Java-based platform uses for browser/server communication. This protocol was scrutinized as part of a week long security review of the Waterken server and was found to be sound.
####Capper First Steps

Install [node.js](http://nodejs.org). Clone Capper to your machine, or download the Capper directory as a zip file and unpack it. Make the Capper root directory your current working directory, and install the dependencies:

> npm install

If you are a mocha user, you may want to run the included tests to make sure the installation worked properly. Capper requires the harmony JavaScript extensions, so go into the Capper directory and execute

>mocha --harmony

or
>npm test

which will do the same thing.

Next, you must modify the capper.config file to suit your needs. To conduct client-server testing on your development machine, you probably want to set "domain" to "localhost"; it will certainly not work if you leave the domain unchanged. Select a port you can open on your machine (beware of firewalls blocking ports, you may have to configure the firewall as well). At this time you must use protocol https. The self-signed certificate embodied in the "ssl" folder will be adequate for simple testing, though you will have to click OK through the cert monolog boxes in your browser.

In a command window, change directories to the Capper folder and startup the server from the command line with
>node --harmony server

or, if you find it is too easy to forget to include the harmony option
>npm start

Now in the browser go to page 
>https://localhost:1341/

(replace "1341" with your port number) which should pop you to the Capper Home page; this page can be edited in the Capper/views/index.html file.

Use a Chrome or Firefox browser for the following examples. To keep the example code short and easy to read, we have not put in the litany of switches needed to handle browser differences, and have not depended on an additional library (like JQuery) to hide the differences (though for a production system, you probably should choose a tool that hides the differences). Some of the examples may work with later versions of IE, but this is not guaranteed. 

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

The -post argument in launching the server invokes the method locally, from inside the server. We can also use the webkey to access our HelloGalaxy service remotely from a command line by using the remoteCall application. Launch the server, and enter the following command:

>node --harmony remoteCall @webkey greet

This should return "Hello Galaxy" as the answer.

Next lets create a very simple web page to display the new service in the browser. In Capper/apps/HelloGalaxy/ui/index.html, put the following web page:
```html
<html><head>
<meta name="referrer" content="never">
<title>Hello Galaxy</title>
</head>
<body><h2>Howdy</h2></body>
</html>
```

This version of the page will not even invoke our object to see what the greeting should really be, but it should be good enough to give us a simple display. Click the webkey in your browser, and confirm you now get a page representing our HelloGalaxy object.

Please note the meta/referrer/never tag in our page. You should always include this header when using webkeys. While the webkeys used by Capper, which place the credential in the fragment, are generally safe from being revealed via the referer header in most browsers, it is safer to explicitly request that the referer header be shut off.

####Using Client-Side CapperConnect to Invoke Server-Side Methods

To actually invoke our server-side object with the "greet" method, get back the answer, and use it to display the actual Hello Galaxy greeting in our page, we need to communicate with our server from the browser. capperConnect.js is a simple wrapper library for webkey protocol that allows us to directly make remote object method invocations (rather than fiddling ourselves with xhr requests and protocol). capperConnect.js is included in the distribution under Capper/views/libs.

To use CapperConnect, upgrade the index.html file to import the Q promise package, CapperConnect, and a javascript file that contains the Hello Galaxy executable:
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
        document.getElementById("greeting").innerHTML = ans;
    }, function(err){document.body.innerHTML += "got err: " + err;});
}
window.onload = showGreeting;
```
After the window loads, the javascript will use CapperConnect to retrieve the actual greeting from our HelloGalaxy object on the server.

CapperConnect.home is a client-side proxy for the server-side object being presented in the page. It has the method "post", which is given a method name ("greet" in this case) and a series of arguments as appropriate for the method invoked. Posting via the proxy returns a promise (a Q.js promise) for the answer; when the promise is fulfilled, it fires the "then" method that invokes the function with the answer (if something goes wrong, and the promise gets rejected, the second function fires with the error as the argument).

####Enable Initialization and Greeting Update
As our last step in this quick introduction, we will enable HelloGalaxy services to be initialized with a greeting during construction, and further allow the greeting to be modified after creation.

Let us enhance the HelloGalaxy service (in Capper/apps/HelloGalaxy/server/main.js, as you hopefully recall) with an initialization method and a setter method:

```javascript
module.exports = function HelloGalaxy(context) {
    "use strict";
    var self = {
        init: function(initialGreeting) {
            if (!("greeting" in context.state)) {self.setGreeting(initialGreeting);}
        },
        setGreeting: function(newGreeting) {context.state.greeting = newGreeting;},
        greet: function() {return context.state.greeting;}
    };
    return Object.freeze(self);
};
```

The "init" method is a special method used by Capper to deliver initialization arguments during the construction of a new persistent object. The context.state object contains persistent data that represents the state of this particular object: if the server is shut down, when the object is revived, context.state contains the earlier state. The system automatically checkpoints the context.state at the end of processing an incoming method invocation, just before returning the answer to the caller. Hence the object survives shutdown and restart just fine as long as the object's persistent data is stored in context.state.

We test at the beginning of the init function to see whether initialization has already taken place, to prevent accidental (or malicious) re-initialization of an already constructed object. In this case, we know the object has not yet been initialized if the "greeting" property in context.state does not yet exist. If we are initializing this object, we invoke our own setGreeting method with the initial greeting.

With this new code, our existing HelloGalaxy service will no longer work correctly: never having been initialized, it does not have a context.state.greeting to retrieve. Check it out: click the link in the browser, you should get something like Null for the greeting in the page. If we had many HelloGalaxy greeting services running, it would be easy enough to add an extra line of code to upgrade each service when it was revived after a shutdown, but for this introduction, let us manually update our HelloGalaxy from the command line. Shut down the server and issue
>node --harmony server -post @webkeyForHelloGalaxy setGreeting "Updated HelloGalaxy Greeting"

Let's see the init method in action by creating another HelloGalaxy service:
>node --harmony server -make helloGalaxy "Hello From a Place Far Far Away"

The webkey returned by this command should show a service with an already-initialized greeting.

####Mocha Testing HelloGalaxy

The back end of the Capper server is "saver.js", which manages the objects and their persistence. You can run mocha tests of your objects by directly using the interface to the saver. To create a simple test of our simple helloGalaxy object, go into Capper/test and create the helloGalaxy.js file. The test code looks like:

```javascript
/*global require describe it console */
var assert = require("assert");
var saver = require("../saver");
describe ("hello galaxy", function() {
    "use strict";
    it("Set and Get Greeting ", function() {        
        var hello = saver.make("helloGalaxy");
        hello.setGreeting("TestHello");
        assert(hello.greet() === "TestHello", 
            "Set Greeting matches Retrieved Greeting");
        saver.drop(saver.asId(hello));
    });
});
```
Run the test by going into the main Capper directory and running mocha:
>mocha --harmony

Our test creates a new helloGalaxy service with saver.make, sets the greeting, and asserts that the greeting retrieved from the service is in fact the greeting that we set. At the end of the testing, we drop the service to avoid having it become a permanent part of our database. The saver.drop method requires the internal persistent id of the object, not a live reference to the object, so we retrieve that with saver.asId(object).

####Setting Greeting from the Browser
As we come to the end of this introduction, we will not show all the code for an upgraded user interface (a larger index.html file with a field for creating a new greeting, and a SetGreeting button for posting it to the server, and a larger hello.js file to go with it), but let us look at the critical additional javascript function in the ui. The additional function on the browser side is setGreeting:

```javascript
function setGreeting(newGreeting) {
    CapperConnect.home.post("setGreeting", newGreeting).then(function() {
        showGreeting();
    });
}
```
Upon invoking the server side object with the setGreeting method, once we get confirmation that it has arrived, we call our existing showGreeting function to update the screen. 

This concludes the introduction. You can continue with [Part 2 of the tutorial](tutorial2.md) as desired. An [API document](API.md) is on its way.
