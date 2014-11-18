/*global, console, module */

"use strict";
/**
* Members is a simple database of people in an organization.
* */
function log(text) {console.log(text);}
function objStr(obj) {
    var str = "";
    for (var next in obj) {
        str += next + ": ";
        var val = typeof obj[next] === "function" ? "function" : obj[next];
        str += val + " || ";
    }
    return str;
}
function makeRecord(recordSpec) {
    var record = {};
    for (var each in recordSpec) {
        record[each] = "";
    }
    return record;
}

/**
 * Mapper is a collection of functions to be used on a simple array and acts like 
 * an EcmaScript6 Map. Mapper maps can use persistent objects as keys, 
 * and can be stored in context.state.
 * Performance is poor for large maps.
 * */
var mapper = {
    make: function() {return [];},
    find: function(map, key) {
        for (var i in map) {if (map[i][0] === key) {return i;}}
        return -1;
    },
    get: function(map, key) {
        var index = mapper.find(map, key);
        return index >= 0 ? map[index][1] : undefined;
    },
    put: function(map, key, val) {
        mapper.del(map, key);
        map.push([key, val]);        
    },
    // revget = reverse get: given a val, return the key
    revget: function(map, val) {
        for (var i in map) {
            if (map[i][1] === val) {return map[i][0];}
        }        
    },
    del: function(map, key) {
        var index = mapper.find(map, key);
        if (index >= 0) {
            map.splice(index, 1);
            return true;
        } else {return false;}
    },
    has: function(map, key) {return mapper.find(map, key) >= 0;},
    keys: function(map) {return map.map(function(next) {return next[0];});},
    values: function(map) {return map.map(function(next) {return next[1];}); }
    //forEach: function(map, fn) {map.forEach}
};

module.exports = function Members() {
    function makeDelegateMgr(context) {
        var mem = context.state;
        var delegator = {
            init: function(self, parentOwner, isRoot, isReadOnly) {
                if (mem.delegates) {return;}
                if (!context.isPersistent(self)){log("ERROR Delegator Nonpersistent Self");}
                if (parentOwner && !context.isPersistent(parentOwner)){
                    log("ERROR Delegator Nonpersistent Owner");                    
                }
                mem.isReadOnly = isReadOnly === true;
                // if isRoot === undefined, created from command line should be true
                mem.isRoot = isRoot || isRoot===undefined;
                mem.parentOwner = parentOwner;
                mem.self = self;
                //delegates is a list of pairs, pair[0]=purpose, pair[1]=delegate
                mem.delegates = [];
            },
            parentOwner: function() {return mem.parentOwner;},
            isReadOnly: function() {return mem.isReadOnly;},
            isRoot: function() {return mem.isRoot;},
            makeDelegate: function(purpose, isReadOnly, maker) {
                var newDelegate = context.make(maker, mem.self, false,  
                    mem.isReadOnly || isReadOnly);
                mem.delegates.push([purpose, newDelegate]);
                //mem.delegates = mem.delegates;
                return newDelegate;
            },
            kill: function(selfContext) {
                var delCopy = mapper.values(mem.delegates);
                delCopy.forEach(function(next, i) {
                    next.kill();
                });
                if (mem.parentOwner) {
                    var oldParent = mem.parentOwner;
                    mem.parentOwner = null;
                    oldParent.removeDelegate(mem.self);                   
                }
                selfContext.drop();
                context.drop();
                return true;
            },
            removeDelegate: function(removed) {
                for (var i = 0; i < mem.delegates.length; i++) {
                    if (mem.delegates[i][1] === removed) {
                        mem.delegates.splice(i, 1);
                        mem.delegates = mem.delegates;
                        removed.kill(); //make sure it's gone if I'm dropping the ref
                        return true;
                    }
                }
                log("ERROR: delegator.removeDelegate found no delegate to remove");
                return false;            
            },
            /** delegates() returns list of pairs, pair[0]=purpose, pair[1]=delegates **/
            delegates: function() {return mem.delegates;}
        };
        return delegator;
    }
    function makeAdmin(context) {
        var mem = context.state;
        //members map has key=member-delegate shown to client, value=member-root
        if (!("members" in mem)) {mem.members = mapper.make();}
        //if (mem.members[0] && !mem.members[0].data) {
        //    log("!!!ERROR!!! members has bad objs, resetting");
        //    log("!!! " + JSON.stringify(mem.members));
        //    mem.members = [];
        //}
        var delMgr = mem.delegateMgr;
        var self = Object.freeze({
            init: function(parentOwner, isRoot, isReadOnly) {
                if (mem.delegateMgr) {return;}
                var mgr = context.make("members.makeDelegateMgr", 
                    self, parentOwner, isRoot, isReadOnly);
                mem.delegateMgr = mgr;
                delMgr = mgr;
            },
            members: function() {return mapper.keys(mem.members);},
            addMember: function() {
                if (delMgr.isReadOnly()) {throw "ReadOnly View";}
                if (!self.isRoot()) {return delMgr.parentOwner().addMember();}
                var newMember = context.make("members.makePerson");
                self.memberAdded(newMember);
                //var newDelegate = newMember.makeDelegate("adminUse", false);
                //mapper.put(mem.members, newDelegate, newMember);
                return mapper.revget(mem.members, newMember);
            },
            memberAdded: function(rootMem) {
                var clientDelegate = rootMem.makeDelegate("adminUse", delMgr.isReadOnly());
                mapper.put(mem.members, clientDelegate, rootMem);
                delMgr.delegates().forEach(function(d, i) {d[1].memberAdded(rootMem);});
            },
            removeMember: function(clientDelegateMember) {
                if (delMgr.isReadOnly()) {throw "ReadOnly View";}
                var rootMem = mapper.get(mem.members, clientDelegateMember);
                if (!rootMem){throw ("members.admin.removeMember: Member not found");}
                if (!delMgr.isRoot()) {return delMgr.parentOwner().removeRootMember(rootMem);}
                self.removeRootMember(rootMem);                
            },
            /** removeRootMember is private, clients should not use it, it will not do anything
              * for such clients since they do not have references to the rootMember **/
            removeRootMember: function(rootMember) {
                if (delMgr.isReadOnly()) {throw "removeRootMember: ReadOnly View";}
                if (!delMgr.isRoot()) {return delMgr.parentOwner().removeRootMember(rootMember);}
                self.memberRemoved(rootMember);
                rootMember.kill();
            },
            memberRemoved: function(rootMem) {
                //note, rootMember is known only to the admins, so this message will
                // only do something if sent by an admin object
                var clientDelegate = mapper.revget(mem.members, rootMem);
                if (!clientDelegate) {console.log("Warning: memberRemoved: no such member"); return false;}
                delMgr.delegates().forEach(function(d, i){d[1].memberRemoved(rootMem);});
                mapper.del(mem.members,clientDelegate);
                clientDelegate.kill();
                return true;
            },
            isReadOnly: function() {return delMgr.isReadOnly();},
            isRoot: function() {return delMgr.isRoot();},
            makeDelegate: function(purpose, isReadOnly) {
                log("new delegate is read only " + isReadOnly)
                var newDelegate = delMgr.makeDelegate(purpose, isReadOnly, "members.makeAdmin");
                var memberRoots = mapper.values(mem.members);
                for (var i in memberRoots) {
                    newDelegate.memberAdded(memberRoots[i]);
                }
                return newDelegate;
            },
            delegates: function() {return delMgr.delegates();},
            kill: function() {
                //if this is admin root, destroy whole membership system
                if (delMgr.isRoot()) {
                    var delCopy = mem.members.map(function(next){return next[1];});
                    delCopy.forEach(function(next, i){
                        self.removeRootMember(next);
                    });
                }
                delMgr.kill(context);                
            },
            removeDelegate: function(removed) {
                // removed could either be a member or an adminDelegate
                return removed.data ? self.removeMember(removed) :
                    delMgr.removeDelegate(removed);                
            }
        });
        return self;
    }
    function makePerson(context) {
        var mem = context.state;
        var delMgr = mem.delegateMgr;
        var recordSpec = {
            Name: {type: "string"},
            DateOfBirth: {type: "date"},
            Street: {type: "string"},
            City: {type: "string"},
            State: {type: "string"},
            ZipCode: {type: "int"},
            PhoneNumber: {type: "string"}
        };
        var self = Object.freeze({
            init: function(parentOwner, isRoot, isReadOnly) {
                if (mem.data) {return;}
                mem.data = makeRecord(recordSpec);
                var mgr = context.make("members.makeDelegateMgr", 
                    self, parentOwner, isRoot, isReadOnly);
                mem.delegateMgr = mgr;
                delMgr = mgr;
            },
            data: function() {
                if (!delMgr.isRoot()) {return delMgr.parentOwner().data();}
                return mem.data;
            },
            setData: function(newData) {
                if (delMgr.isReadOnly()) {throw "Read Only Access";}
                if (!delMgr.isRoot()) {return delMgr.parentOwner().setData(newData);}
                for (var next in newData) {mem.data[next] = newData[next];}
                mem.data = mem.data;
                return true;
            },
            isReadOnly: function() {return delMgr.isReadOnly();},
            isRoot: function() {return delMgr.isRoot();},
            makeDelegate: function(purpose, isReadOnly) {
                return delMgr.makeDelegate(purpose, isReadOnly, "members.makePerson");
            },
            delegates: function() {return delMgr.delegates();},
            kill: function() {delMgr.kill(context);},
            removeDelegate: function(removed) {return delMgr.removeDelegate(removed);},
            recordSpec: function(){return recordSpec;}
        });
        return self;
    }

    return Object.freeze({
        makeAdmin: makeAdmin,
        makePerson: makePerson,
        makeDelegateMgr: makeDelegateMgr
    });
}();