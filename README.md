##Capper

Capper is a web application framework built on Node.js/Express (with Q.js for promises) that implements object capability security using unguessable urls (i.e., _webkeys_) for access control. Persistence of exportable objects (which behave like individual small services) is automated, and a webkey is associated with each such persistent exportable object at creation.

By using webkeys for access control, Capper makes it quick and easy to build applications for which people do not need usernames or passwords: they just bookmark the link to the object they have been granted access to, and to connect to the object they just click the link and go to work. As explained in the YouTube video at https://www.youtube.com/watch?v=C7Pt9PGs4C4 it can be reasonably argued that such webkey based access control is at least as secure as using passwords. 
