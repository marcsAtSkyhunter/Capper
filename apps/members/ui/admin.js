/*global console, document, CapperLayout, CapperConnect, stderr, $, makeDelegationMgr */
function loadAdminUI() {
    "use strict";
    document.title = "Membership Admin";
    function log(text) {console.log(text);}
    var isRootVow = CapperConnect.home.post("isRoot");
    var C = CapperLayout;
    function link(text, url) {return C.jnode("a").text(text).attr("href", url);}
    function makeMembersTable() {
        var table = C.jtable();
        CapperConnect.home.post("members").then(function(members){
            $.each(members, function(i, next) {
                next.post("data").then(function(memberData){
                    table.append(C.jrow(
                        link(memberData.Name, next.webkey), memberData.Street
                    ));                    
                }, stderr("memberData"));
            });
        }, stderr("bad members"));
        return table;
    }
    var membersTable = makeMembersTable();
    var addMemberName = C.jnode("input");
    var addMemberDiv = C.jdiv().append(
        "Add Member", addMemberName, C.jbutton("Add", function(){
            CapperConnect.home.post("addMember").then(function(newGuy){
                log("got new guy" + newGuy.webkey);                
                newGuy.post("setData", {Name: addMemberName.val()});
            }, stderr("addMember"));
        })
    );
    var deleteMemberDiv = C.jdiv();
    $(document.body).append(C.jnode("h3").append("Membership Admin"),
        "Members", C.jbr(),
        membersTable, C.jbr(),
        addMemberDiv, C.jbr(),
        deleteMemberDiv, C.jbr(),
        C.jnode("hr"),
        makeDelegationMgr().div
    );

}
window.onload =loadAdminUI;