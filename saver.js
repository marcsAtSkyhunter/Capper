/*
Copyright 2011 Hewlett-Packard Company. This library is free software;
you can redistribute it and/or modify it under the terms of the GNU
Lesser General Public License (LGPL) as published by the Free Software
Foundation; either version 2.1 of the License, or (at your option) any
later version.  This library is distributed in the hope that it will
be useful, but WITHOUT ANY WARRANTY; without even the implied warranty
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.  You should have
received a copy of the GNU Lesser General Public License (LGPL) along
with this library; if not, write to the Free Software Foundation,
Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
Please contact the Hewlett-Packard Company <www.hp.com> for
information regarding how to obtain the source code for this library.

@flow
*/

/*global require, Map, console, Proxy, setImmediate */
/* eslint-env node */
"use strict";
var Q = require("q");
var caplib = require("./caplib");

exports.makeSaver = makeSaver;
function makeSaver(unique /*: () => string*/,
                   fs /*: FSAccess*/, fss /*: FSSync*/,
                   reviverToMaker /*: (path: string) => any*/) /*: Saver */
{
    var dbfile = "capper.db";
    function log(text) {console.log(text);}

    // modifiedObjs has a cred as key and null as value; it is a set
    var modifiedObjs = {};
    var checkpoint; var make; var live;

    /**
     * Generally, a turn begins when a message is delivered from the server,
     * and at the end of the turn, saver automatically initiates a checkpoint
     * and gives the server a promise for the answer. The answer is fulfilled
     * when the checkpoint is complete, and the server can then ship the answer
     * back to the client.
     *
     * However, if an app object internally uses mechanism like
     * setTimeout or NextTick or an internal promise to make something happen
     * later, the checkpointing system has no way of knowing about that new
     * turn that has been queued.
     *
     * For the moment, the solution is as follows: any time a persistent object
     * changes its context.state, we look at the checkpointNeeded flag. If false,
     * we set it to true and setImmediate a checkpointIfNeeded. The checkpoint
     * function itself clears the flag. If state is changed during a normal
     * method invocation turn, the checkpointIfNeeded will find the flag already
     * cleared by the automatic checkpoint by the time its turn fires. If
     * state is changed during a
     * timer event, the checkPointIfNeeded takes care of it.
     *
     * To allow the checkpointer to not checkpoint if no state changed,
     * the make and drop operations must also set checkpointNeeded.
    **/
    var lastCheckpointQueued = new Q(true);
    var checkpointNeeded = false;
    function checkpointIfNeeded() {
        if (checkpointNeeded) {
            checkpoint();
        }
    }
    function setupCheckpoint() {
        if (!checkpointNeeded) {
            checkpointNeeded = true;
            setImmediate(checkpointIfNeeded);
        }
    }

    function credToId(cred) {return Object.freeze({"@id": cred });}
    function idToCred(id) {return id["@id"];}

    /**
     * systate keys are the credentials from the webkeys, i.e., from the "ids".
     * each value is a map with
     *   data: the pure data for reviving the object
     *   reviver: an array of strings for finding the function to revive it
     *      array[0] is the path to the code to be loaded via require
     *      array[1] is the optional method to invoke
     **/
    var sysState = {};
    function loadSysState() {
        if (!fss.existsSync(dbfile)) {fss.writeFileSync(dbfile, "{}");}
        var jsonState = fss.readFileSync(dbfile, "utf8");
        if (jsonState.length === 0) {jsonState = "{}";}
        sysState = JSON.parse(jsonState);
    }
    loadSysState();
    var validStateObj;
    checkpoint = function() {
        var vowPair = Q.defer();
        for (var next in modifiedObjs) {
            try {
                checkpointNeeded = true;
                var initState = sysState[next].data;
                var state = validStateObj(initState);
                if (!state) {
                    console.log("!!!ERROR bad function in checkpoint for object of type " +
                        sysState[next].revive);
                }
            } catch (err) {
                //missing cred in modifiedObjs, probably dropped from the table
            }
        }
        modifiedObjs = {};
        if (!checkpointNeeded) {
            vowPair.resolve(lastCheckpointQueued);
        } else {
            checkpointNeeded = false;
            //force sequentiality on multiple pending checkpoints
            var last = lastCheckpointQueued;
            lastCheckpointQueued = vowPair.promise;
            last.then(function(_ok) {
                var jsonState = JSON.stringify(sysState);
                checkpointNeeded = false; //yes, say it again on each turn
                fs.writeFile(dbfile, jsonState, function (err) {
                    if (err) {
                        console.log("checkpoint failed: " + err);
                        vowPair.reject(err);
                    } else {vowPair.resolve(true);}
                    //log("db size after write: "+ fs.statSync("capper.db").size);
                });
            });
        }
        return vowPair.promise;
    };
    /*
     * livestate keys are the credentials.
     * each value is the reference to the corresponding object
     */
    var liveState = {};

    //each key is the ref to the live object, the value is the id that contains the cred
    var liveToId /*: Map<any, Object>*/ = new Map();

    function asId(ref) /*: Object*/{
        var id = liveToId.get(ref);
        if (id === undefined) throw ("asId bad ref");
        return id;
    }
    function hasId(ref) {return liveToId.has(ref);}

    validStateObj = function(obj) {
        if (obj === null) {return null;}
        var id = liveToId.get(obj);
        if (id) {return id;}
        for (var key in obj) {
            var nextval = obj[key];
            if (typeof nextval === "function") {
                console.log("!!!ERROR found function in validStateObj " + nextval);
                return null;
            }
            if (typeof nextval === "object") {
                var childObj = validStateObj(nextval);
                //cannot get here unless the object is valid
                obj[key] = childObj;
            }
        }
        return obj;
    };
    function drop(id) {
        setupCheckpoint();
        var cred = idToCred(id);
        if (liveState[cred]) {liveToId.delete(liveState[cred]);}
        delete liveState[cred];
        delete sysState[cred];
    }

    function makePersister(id) {
        var cred = idToCred(id);
        var data = sysState[cred].data;
        var constructorLocation = sysState[cred].reviver;
        //does modify in place converting ids to live objs; impossible complications
        // when making a copy, context.state.array[3] = 5 cannot update state
        function convertForExport(thing) {
            if (typeof thing !== "object") {return thing;}
            if (thing === null || thing === undefined) {return thing;}
            if (liveToId.get(thing)) {return thing;}
            if (idToCred(thing)) {return live(thing);}
            for (var next in thing) {
                var replacement = convertForExport(thing[next]);
                if (thing[next] !== replacement) {thing[next] = replacement;}
            }
            return thing;
        }
        var p = Proxy.create({
            //TODO unwind gotten objects to replace ids with persistent objs
            get: function(proxy, key) {
                var ans = convertForExport(data[key]);
                if (ans && typeof ans === "object" && !hasId(ans)) {
                    modifiedObjs[cred] = null;
                }
                return ans;
            },
            set: function(proxy, key, val) {
                setupCheckpoint();
                modifiedObjs[cred] = null;
                data[key] = val;
                var typ = typeof(val);
                if (typ === "function") {
                    throw "Function in context.state disallowed in " + constructorLocation;
                }
                if (typ === "object") {
                    if (val === null) {
                        data[key] = null;
                    } else {
                        var obj = validStateObj(val);
                        if (obj) {
                            data[key] = obj;
                        } else {
                            throw "NonPersistent Object in context.state.set disallowed in "+
                                constructorLocation + " badObj: " + val;
                        }
                    }
                } else {data[key] = val;}
                return true;
            },
            has: function(name) {return name in data;}
            //delete, iterate, keys
        });
        return p;
    }
    function State(id) {
        return makePersister(id);
    }

    /*
     * Context is a map that contains
     *  make(creationFn, args...) that returns a new persistent object. The
     *      creationFn is a function that receives as first 2 arguments a
     *      context and a state; if state is null, it looks for the args
     *      to do its initial construction, if state is not null, this is
     *      a revival
     *  state is a proxied map that stores the persistent instance data for this
     *     object. Attempts to store functions or nonpersistent objects will throw exceptions.
     *  drop() removes yourself (eventually!) from the persistence system
     *
     */
    function makeContext(id, _constructorLocation) {
        var newContext = {
            make: make,
            state: new State(id),
            drop: function() {drop(id);},
            isPersistent: function(obj) {
                var id = liveToId.get(obj);
                return id !== undefined && id !== null;
            }
        };
        return Object.freeze(newContext);
    }

    make = function(makerLocation, _optInitArgs) {
        setupCheckpoint();
        var cred = unique();
        var newId = credToId(cred);
        sysState[cred] = {data: {}, reviver: makerLocation};
        var newContext = makeContext(newId);
        var maker = reviverToMaker(makerLocation);
        var obj = maker(newContext);
        liveState[cred] = obj;
        liveToId.set(obj, newId);
        var initArgs = [];
        for (var i = 1; i <arguments.length; i++) {initArgs.push(arguments[i]);}
        if ("init" in obj) {obj.init.apply(undefined, initArgs);}
        return obj;
    };
    live = function(id) {
        var cred = idToCred(id);
        var obj = liveState[cred];
        if (obj) {return obj;}
        var revivalData = sysState[cred];
        if (!revivalData) {return null;}
        var context = makeContext(id);
        var maker = reviverToMaker(revivalData.reviver);
        obj = maker(context, revivalData.data);
        liveState[cred] = obj;
        liveToId.set(obj, id);
        return obj;
    };
    function reviver(id) {return sysState[idToCred(id)].reviver;}
    function deliver(id, method, _optArgs) {
        var actualArgs = [];
        for (var i = 2; i < arguments.length; i++) {actualArgs.push(arguments[i]);}
        caplib.tvalid(arguments, "os", true, "saver.deliver bad args");
        var ansPair = Q.defer();
        var target = live(id);
        try {
            var targetMethod = target ? target[method] : {};
            var ans = targetMethod.apply(undefined, actualArgs);
            checkpoint().then(function(_ok) {
                ansPair.resolve(ans);
            });
        } catch (err) {
            checkpoint().then(function(_ok) {
                var errMsg = "saver.deliver err ";
                try {
                    errMsg = "saver.deliver err on " + reviver(id) +
                        " method " + method + " " + err;
                    log(errMsg);
                } catch (e2) {errMsg += "Target object service no longer exists";}
                ansPair.reject(errMsg);
            });
        }
        return ansPair.promise;
    }
    var self = {
        clearLive: function() {liveState = {}; liveToId = new Map();},
        reload: function() {
            var vowPairLoaded = Q.defer();
            self.clearLive();
            checkpoint().then(function(ok) {
                sysState = {}; loadSysState();
                vowPairLoaded.resolve(ok);
            });
            return vowPairLoaded.promise;
        },
        zeroSysState: function() {sysState = {};},
        deliver: deliver,
        make: make,
        reviver: reviver,
        hasId: hasId,
        asId: asId,
        idToCred: idToCred,
        credToId: credToId,
        live: live,
        checkpoint: checkpoint,
        drop: drop
    };
    return Object.freeze(self);
}
