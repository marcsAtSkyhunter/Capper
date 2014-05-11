###Capper
Capper is a web application framework built on Node.js/Express (with Q.js for promises) that implements object capability security using unguessable urls (i.e., _webkeys_) for access control. Persistence of exportable objects (which behave like individual small services) is automated, and a webkey is associated with each such persistent exportable object at creation.

By using webkeys for access control, Capper makes it quick and easy to build applications for which people do not need usernames or passwords: they just bookmark the link to the object they have been granted access to, and to connect to the object they just click the link and go to work. As explained in the YouTube video at https://www.youtube.com/watch?v=C7Pt9PGs4C4 it can be reasonably argued that such webkey based access control is at least as secure as using passwords. Webkeys also make it easier to enable rich sharing wherein each participant in the handling of a resource gets as much authority as he needs and no more; see the youtube video on Rich Sharing at https://www.youtube.com/watch?v=T92ZboMsH1w to learn about key features of sharing that are common in the physical world but very rare on the web; the 2Click Sharing video at https://www.youtube.com/watch?v=cJThfgXMBA4 briefly shows a system entirely built with webkeys that enables such rich sharing on the web.

Capper uses the same webkey protocol that the waterken platform uses for browser/server communication. You can read more about webkeys, their virtues and their implementation, at http://waterken.sourceforge.net/
####Capper Startup
To get started, you will need to modify the capper.config file to suit your needs. To conduct client server testing on your development machine, you probably want to set "domain" to "localhost". Select a port you can open on your machine (beware of firewalls blocking ports, you may have to configure the firewall as well). At this time you must use protocol https. The self-signed certificate embodied in the "ssl" folder will be adequate for simple testing, though you will have to click OK through the cert monolog boxes.

In a command window, change directories to the Capper folder and startup the server from the command line with
>node --harmony server

Now in the browser go to page 
>https://localhost:1341/

which should pop you to the Capper Home page; this page can be edited in the Capper/views/index.html file.

####Create A New HelloWorld Service
To create a private hello world page, accessible only by you, shut down the server and type the command
>node --harmony server -make hello

This should print out a url that is a private unguessable url, it should look something like this:
>https://localhost:1341/ocaps/#s=Vs6Q6ofuVL_DzzqoYe8cEuO

The part after the "#s=" is the cryptographically strong and unguessable credential. This url refers to a new private Hello World page. Turn on the server again, go to this url, and you should see it. Bookmark the url if you want to go back to see it again later.

You can destroy a service with the "drop" command using the credential. For the example service url above, you would destroy it with
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

Note that the HelloGalaxy function that makes HelloGalaxy services receives a "context" as an argument. Among other things, the object context.state stores the persistent data associated with a particular instance of the service type, as we will see later.


