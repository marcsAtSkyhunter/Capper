###Tutorial 2: The Plus/Minus Counting System

####Goals
In this tutorial we demonstrate the following additional features of Capper:

* Dynamically creating, from an existing persistent/webkeyed object, a new persistent/webkeyed object
* Sharing editable persistent data across multiple persistent objects
* Using different objects with different webkeys to grant different people different rights and authorities on a single underlying object, i.e., enforcing separation of roles and responsibilities.

The server-side code for the PlusMinus system is found in [apps/plusMinus/server/main.js](apps/plusMinus/server/main.js). There are 3 files for the user interface code for the 3 different kinds of objects in the system, all in the [apps/plusMinus/ui](apps/plusMinus/ui) directory.

####Problem Introduction
PlusMinus creates a service with 3 interwoven mini-services, each mini-service a single object. The 3 objects allow you to increment a counter, decrement the counter, and read the counter. 

For example, suppose you have Alice, Bob, and Carol working together. Alice wants to see if there are more blue cars driving down the highway than red cars. She wants Bob to increment a counter each time he sees a blue car, and she wants Carol to decrement the counter each time she sees a red car. If the counter>0 at any time, more blue cars have passed; if the counter<0, more red cars have passed.

So Alice creates a plus/minus service with 3 webkeys: the root plus/minus object, the incrementer, and the decrementer.

The root holds the webkeys for both the incrementer and the decrementer, and also has the method that allows the webkey holder (Alice) to read the current count. Alice gives the incrementer webkey to Bob, and the decrementer webkey to Carol.

Because of the nature of the fine grain access via the webkeys, Bob can only increment, he can neither decrement nor see the current count. Carol can similarly only decrement.

####Server-Side Root Object Code

In the PlusMinus system, the main.js file found in apps/plusMinus/server/main.js contains constructors for the 3 different kinds of objects used in the system: there are constructors for the root, the incrementer, and the decrementer. We want these 3 objects to share access to a persistent mutable counter object: the root reads this counter, the incrementer adds to the counter, the decrementer subtracts from the counter.

Here we implement the shared persistent mutable counter using a "shared" persistent data object. The "shared" object is a persistent app object just like any other, but it comes predefined with Capper in the apps/shared app folder. It has no methods (so it cannot be accessed remotely), but it does have the property "state" that exposes its own context.state object to any object that holds a reference to it.

Let us look at the code for the root constructor:

```javascript
    function makeRoot(context) {
        var mem = context.state;
        if (!("incr" in mem)) {
            mem.counter = context.make("shared");
            mem.counter.state.count = 0;
            mem.incr = context.make("plusMinus.makePlus", mem.counter);
            mem.decr = context.make("plusMinus.makeMinus", mem.counter);
        }
        return Object.freeze({
            incrementer: function() {return mem.incr;},
            decrementer: function() {return mem.decr;},
            count: function(){return mem.counter.state.count;}
        });
    }
```

The makeRoot method is called under 2 circumstances. First it is called when a new plusMinusRoot is being newly constructed and initialized. Later, if the server shuts down and is restarted, makeRoot is called to revive the object. In this second case, the object has already been initialized. We can distinguish whether the object is being revived or newly constructed by looking at the context.state object to see if it has any of the instance variables it should have; in this code we test 

```javascript
    "incr" in mem      // mem is a shortcut for context.state
```

and if this property does not exist, this is new construction, and we initialize by creating a counter (which is a "shared" data object), an incrementer, and a decrementer. 

To make a new persistent object, we use the _context.make_ function. If we are creating an object from an app that only has one kind of object, we give the app name as the first argument, followed by a list of initialization arguments. In the case of the shared object, there are no initialization arguments, so we simply invoke _context.make("shared")_.

Once we have a shared counter object, we initialize the count to zero with _mem.counter.state.count = 0_.

Next we create an incrementer. makePlus is another constructor in the same app, and the same file, as makeRoot. If we wish to use the constructor from an app that has multiple constructors, we give context.make the concatenation of the app name and the constructor name as the first argument, as in _context.make("plusMinus.makePlus", mem.counter)_; the second argument, mem.counter, is the shared object that contains the count.

We create the decrementer the same way we create the incrementer. The incrementer, decrementer, and counter all must be stored in the root's persistent context.state.

####Server Side Incrementer Code
The makePlus constructor that makes an incrementer has one more Capper feature to introduce: the _init_ function. The code is:

```javascript
    function makePlus(context) {
        var mem = context.state;
        return Object.freeze({
            init: function(sharedCounter) {
                if (!mem.counter) {mem.counter = sharedCounter;}
            },
            increment: function() {++mem.counter.state.count;}
        });
    }
```

Remember from the discussion of the Root object that the incrementer must receive the "shared" counter object when it is constructed. Constructor arguments are not passed to the makePlus function itself along with the context; rather, the makePlus function still receives only its context object, and initialization arguments are passed to the "init" method (for reasons beyond the scope of this tutorial, we found passing the initialization arguments alongside the context to be error prone when reviving the object, when those arguments would be undefined). Since the init method is public, and can be called multiple times either by accident or by malice, it must be guarded to ensure it is only used once. In makePlus, we check to see if we already have the counter in context.state before performing the initialization. If the counter does not yet exist, we initialize it.

The second method in the incrementer -- the only method that an outside client can sensibly call -- simply updates the counter's count.

####Client Side Root Code
In the HelloWorld tutorial, in the app there was only one kind of object. The constructor for the object was the function found at apps/appname/server/main.js, and the user interface for that object was found at apps/appname/ui/index.html. plusMinus is more complex, with three objects, so main.js is not a function, rather it is an object with 3 functions that construct the objects. So plusMinus does not have an index.html. Rather, it has 3 principle html files, one for each of the object types, which use the same name as the matching constructor in main.js. So the 3 pages are makeRoot.html, makePlus.html, and makeMinus.html. Any JavaScript libraries included by these pages can have arbitrary names, so long as the name and the path are correctly specified in the html. In plusMinus, the makeRoot.html page includes the library root.js, for example.

As we saw in the first tutorial, CapperConnect is a convenient library to enable the browser to speak to objects on the server. CapperConnect.home is a browser-side proxy for the server-side object whose webkey the browser is pointing at. Proxies have a function, _post_, which we saw in action the the HelloWorld tutorial, and a property, _webkey_, that stores the url for the server-side object represented by the proxy. If the method invoked via post returns a simple value like a string, that is the value fulfilled when the promise generated by the post resolves, as in the [root.js code](apps/plusMinus/ui/root.js) for retrieving the count:

```javascript
    CapperConnect.home.post("count").then(function(count){   //requesting and receiving the count
```
If you post to a method that returns a persistent object, the returned value is a proxy for that object. So when we invoke the "incrementer" method on the root object, we get back a proxy for the incrementer object. We then use the _webkey_ property of that proxy to create a link on the page that the user can click to go to the incrementer's page, or we can copy the link and send it to someone else (as Alice sends the incrementer link to Bob):

```javascript
    CapperConnect.home.post("incrementer").then(function(incr){         // the incr argument is a proxy
        elem("incr").innerHTML = makeLink("Incrementer", incr.webkey);  // use incr.webkey to create a link
    });
```
