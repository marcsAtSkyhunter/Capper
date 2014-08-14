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

module.exports = function Members() {
    function makeDelegateMgr(context) {
        var mem = context.state;
        var delegator = {
            init: function(self, parentOwner, isRoot, isReadOnly) {
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
                mem.delegates = mem.delegates;
                return newDelegate;
            },
            kill: function(selfContext) {
                var delCopy = mem.delegates.map(function(next){return next;});
                delCopy.forEach(function(next, i) {
                    next[1].kill();
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
            delegates: function() {return mem.delegates;}
        };
        return delegator;
    }
    function makeAdmin(context) {
        var mem = context.state;
        if (!("members" in mem)) {mem.members = [];}
        if (mem.members[0] && !mem.members[0].data) {
            log("!!!ERROR!!! members has bad objs, resetting");
            log("!!! " + JSON.stringify(mem.members))
            mem.members = [];
        }
        var delMgr = mem.delegateMgr;
        var self = Object.freeze({
            init: function(parentOwner, isRoot, isReadOnly) {
                if (mem.delegateMgr) {return;}
                var mgr = context.make("members.makeDelegateMgr", 
                    self, parentOwner, isRoot, isReadOnly);
                mem.delegateMgr = mgr;
                delMgr = mgr;
            },
            members: function() {log("mem0:" + objStr(mem.members[0]));return mem.members;},
            addMember: function() {
                if (delMgr.isReadOnly()) {throw "ReadOnly View";}
                var newMember = context.make("members.makePerson");
                var temp = mem.members;
                temp.push(newMember);
                log (temp)
                mem.members = temp; //tell context that mem.members changed
                log(mem.members)
                return newMember;
            },
            removeMember: function(member) {
                if (delMgr.isReadOnly()) {throw "ReadOnly View";}
                for (var i = 0; i < mem.members.length; i++) {
                    if (mem.members[i] === member) {
                        mem.members.splice(i, 1);
                        mem.members = mem.members;
                        member.kill();
                        return true;
                    }
                }
                throw ("Member not found");
            },
            isReadOnly: function() {return delMgr.isReadOnly();},
            isRoot: function() {return delMgr.isRoot();},
            makeDelegate: function(purpose, isReadOnly) {
                return delMgr.makeDelegate(purpose, isReadOnly, "members.makeAdmin");
            },
            delegates: function() {return delMgr.delegates();},
            kill: function() {
                //if this is admin root, destroy whole membership system
                if (delMgr.isRoot()) {
                    var delCopy = mem.members.map(function(next){return next;});
                    delCopy.forEach(function(next, i){
                        self.removeMember(next);
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
                for (var next in newData) {log("setdata " + next);mem.data[next] = newData[next];}
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