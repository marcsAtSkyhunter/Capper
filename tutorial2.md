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

####Server-Side code

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

> "incr" in mem

and if this property does not exist, this is new construction, and we initialize by creating a counter (which is a "shared" data object), an incrementer, and a decrementer. 

To make a new persistent object, we use the context.make function. If we are creating an object from an app that only has one kind of object, we give specify the app name as the first argument, followed by a list of initialization arguments. In the case of the shared object, there are no initialization arguments, so we simply invoke _context.make("shared")_.

