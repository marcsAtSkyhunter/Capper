###Not Ready For Review Draft: Capper API
Capper has special objects for use by application services on both the server side and the client side. First, we discuss general principles of creating a new application.
####File Layout for a Capper Application
A Capper service is actually a single persistent exportable object that has been assigned a webkey, so it can receive messages from outside the server. An application is a collection of such services that work together to deliver a solution to a client. 

All the code and data for a single application goes into a subdirectory in the Capper/apps folder. Code for the services goes in server subfolder; code and data for the browser display of the services goes in the ui subfolder. All the types of services in the app can be created with constructors found in server/main.js. The code is stored as a standard node.js module. 

If there is only one kind of exportable object in the app, its browser-side html is stored in ui/index.html. So the layout for a simple app with only a single type of object looks like this:

Capper/apps/myApp/server/main.js
Capper/apps/myApp/ui/index.html

If there is only one kind of exportable object in the app, the main function in main.js is the constructor for the object; if there is more than one kind of object, the main.js module exports an object with constructors for each of the objects. If there are multipe types of objects, each object has a separate html file in the ui folder. So if there were 2 types of objects with constructors makeAdder and makeSubtractor, there would be at least 2 files in the ui folder, makeAdder.html and makeSubtractor.html.

####Context Object for Persistent Services


####API for Saver.js for Testing Applications

####CapperConnect for Browser Communication

####Installing HTTPS Certificates

The files for the certificate are stored in [Capper/ssl](ssl). Generate a new cert, store the files in this directory, and Capper will automatically use them. 

####Command Line Operations
