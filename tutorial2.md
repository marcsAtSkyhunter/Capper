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

####Layout of the Server-Side code

In the PlusMinus system, the main.js file found in apps/plusMinus/server/main.js contains constructors for the 3 different kinds of objects used in the system: there are constructors for the root, the incrementer, and the decrementer.
