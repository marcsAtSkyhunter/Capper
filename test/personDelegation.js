/*global require describe it console */
var assert = require("assert");
var saver = require("../saver");
var fs = require("fs");
var Q = require("q");
describe ("MemberPersonDelegation", function() {
    "use strict";
    it("Basic Person", function() {        
        var person = saver.make("members.makePerson");
        assert(person.data().Name === "", "should have blank name");
        person.setData({Name: "marc", Street: "219 Silver"});
        assert(person.data().Name === "marc", "should have name marc");
        var id = saver.asId(person);
        person.kill();
        assert(saver.live(id) === null, "should have live person null");
    });
    it("Basic Delegate/Revoke/KillRoot", function() {
        var person = saver.make("members.makePerson");
        person.setData({Name: "marc", Street: "219 Silver"});
        var child = person.makeDelegate("simpleChildTest", false);
        assert(person.delegates().length === 1, "persion should have 1 delegate");
        assert(person.delegates()[0][0] === "simpleChildTest", "childpurpose should be simple");
        assert(child.data().Name === "marc", "child should have name marc");
        child.setData({Name: "alice"});
        assert(person.data().Name === "alice", "root should have name alice");
        child.kill();
        try {
            assert(child.data().Name !== "alice", "data from revoke should have failed");
            assert(false, "child should have been revoked");
        } catch (e) {
            assert(person.data().Street === "219 Silver", 
                "root should still have street");
        }
        var id = saver.asId(person);
        person.kill();        
        assert(saver.live(id) === null, "should have live person null");        
    });
    it("DeepDelegateReadOnly", function() {
        var person = saver.make("members.makePerson");
        person.setData({Name: "marc", Street: "219 Silver"});
        var child = person.makeDelegate("childL1", false);
        var subchild = child.makeDelegate("childL2", true);
        assert(subchild.data().Name === "marc", "subchild should have name marc");
        try {
            subchild.setData({Name: "bob"});
            assert(false, "subchild setdata should throw");
        } catch (e) {}        
        assert(subchild.data().Name === "marc", 
            "after failed update subchild should still have name marc");
        var subchildId = saver.asId(subchild);
        person.kill();
        assert(saver.live(subchildId) === null, "subchild should be gone");        
    });
    it("Members Admin", function() {
        var admin = saver.make("members.makeAdmin");
        var person = admin.addMember();
        assert(admin.members().length === 1, "num members should be 1");
        var pid = saver.asId(person);
        admin.removeMember(person);
        assert(admin.members().length === 0, "should be no members");
        assert(saver.live(pid) === null, "removed member should not exist");
        var aid = saver.asId(admin);
        admin.kill();
        assert(saver.live(aid) === null, "killed admin should not exist"); 
        saver.checkpoint().then(function(ok){console.log("checkpointed");});
    });
});