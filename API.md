###Not Ready For Review Draft: Capper API
Capper has special objects for use by application services on both the server side and the client side. First, we discuss general principles of creating a new application.
####File Layout for a Capper Application
A Capper service is actually a single persistent exportable object that has been assigned a webkey, so it can receive messages from outside the server. An application is a collection of such services that work together to deliver a solution to a client. 

All the code and data for a single application goes into a subdirectory in the Capper/apps folder. Code for the services goes in server subfolder; code and data for the browser display of the services goes in the ui subfolder. All the types of services in the app can be created with constructors found in server/main.js; if there is only one kind of service in the app, its browser-side html is stored in ui/index.html. So the layout for a simple app looks like this:

Capper/apps/myApp

server/main.js |  ui/index.html
                    


####Context Object for Persistent Services

####CapperConnect for Browser Communication

####Command Line Operations
