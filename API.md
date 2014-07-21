###Not Ready For Review Draft: Capper API
Capper has special objects for use by application services on both the server side and the client side. First, we discuss general principles of creating a new application.


####File Layout for a Capper Application
A Capper service is actually a single persistent exportable object that has been assigned a webkey, so it can receive messages from outside the server. An application is a collection of such services that work together to deliver a solution to a client. 

All the code and data for a single application goes into a subdirectory in the Capper/apps folder. Code for the services goes in server subfolder; code and data for the browser display of the services goes in the ui subfolder. All the types of services in the app can be created with constructors found in server/main.js. The code is stored as a standard node.js module. 

If there is only one kind of exportable object in the app, its browser-side html is stored in ui/index.html. So the layout for a simple app with only a single type of object looks like this:

Capper/apps/myApp/server/main.js
Capper/apps/myApp/ui/index.html

If there is only one kind of exportable object in the app, the main function in main.js is the constructor for the object; if there is more than one kind of object, the main.js module exports an object with constructors for each of the objects. If there are multipe types of objects, each object has a separate html file in the ui folder. So if there were 2 types of objects with constructors makeAdder and makeSubtractor, there would be at least 2 files in the ui folder, makeAdder.html and makeSubtractor.html.

####Context Object and method init(args...) for Persistent ServiceObjects
Every exportable object receives, at construction time, a context object. Exportable objects are constructed under 2 circumstances: when the object is initially being created, and when the object is being revived. In both circumstances, the constructor receives a context object and no other arguments. If during initial creation the object needs to receive arguments, these arguments are passed to the object via the optional init(args...) method that is invoked immediately by Capper immediately after construction, before being returned to the entity that requested creation of the object. Since the init(...) method is public, the developer must put a guard in the method to ensure it executes no more than once.

The context object has 3 properties:

- __context.drop()__: drops this object from the persistence and export systems. If an object drops itself, it can no longer be accessed via webkey. It will be garbage collected the next time the server shuts down and restarts. If another object on the server is holding a direct temporary reference (not stored in context.state), it will continue to be able access the object until the server shuts down. Therefore, one may want to perform a drop() only as part of a revoke() operation in which the object changes its state so that it throws exceptions any time it is called.
- __context.state__: This property holds persistent object state that needs to survive server shutdowns and restarts. The context.state object behaves like a standard JavaScript map: context.state.a = 3, for example, places the value 3 in the property "a". There are several restrictions on what can and cannot be stored in context.state. You _can_ store any basic data type, including strings, booleans, and numbers. You _can_ store references to exportable objects. You _cannot_ store functions. You _can_ store arrays and maps filled with basic data and exportable objects. You _cannot_ store non-exportable, none-persistent objects that include functions. When storing a map or an array, care must be exercised if you modify elements in the collection. The Capper persistence system cannot detect modification inside such collections and may not store them. So in order to modify the second element in an array, for example, you must not only modify the array, you must also store the array inside context.state again, as in this example:
```javascript
  context.state.theArray[1] = newvalue;
  context.state.theArray = context.state.theArray;
```
- __context.make(objectSpec, args...)__: 


####API for Saver.js for Testing Applications

####CapperConnect for Browser Communication

####Installing HTTPS Certificates

The files for the certificate are stored in [Capper/ssl](ssl). Generate a new cert, store the files in this directory, and Capper will automatically use them. 

####Command Line Operations
