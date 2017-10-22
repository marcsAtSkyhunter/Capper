var assert = require("assert");
var caplib = require("../caplib");
var unique = caplib.makeUnique(require("crypto").randomBytes);
describe ("caplib", function() {
    it("should return not equal for 3 and 4", function() {
        assert(3!==4);
    });
    it("unique should return 25 char distinct tokens ", function() {
        var t1 = unique();
        var t2 = unique();
        assert(t1.length == 25, "not 25 char long");
        assert(t2 !== t1, "not matching uniques");
    });
    it("typeCheck should pass good args, but not bad args", function() {
        function fn(a,b,c,d,e) {
            return caplib.typeCheck(arguments, "nsbof");
        }
        assert(fn(3,"a",true,{},fn), "good args");
        assert(!fn(3, 4, true, true, {}), "bad args");
    });
    it("clonemap should dup", function() {
        var clone = caplib.cloneMap({a: 1, b: {c:2}});
        assert(clone.a === 1, "clone.a is 1");
        assert(clone.b.c === 2, "clone.b.c is 2");
    });
    it("argMap should extract -drop and -map", function() {
        var args = ["node","--harmony","server",
            "-drop","abcd"];
        var map = caplib.argMap(args);
        assert(map["-drop"][0] === "abcd", "drop is good");
        args[3] = "-make";
        args[4] = "money.makePurse";
        args[5] = "#3";
        map = caplib.argMap(args);
        assert(map["-make"][0] === "money.makePurse" &&
            map["-make"][1] === 3, "make is good");
    });
});
