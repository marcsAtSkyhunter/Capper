/*global console, document, CapperLayout, CapperConnect, stderr, $, makeDelegationMgr */
function loadAdminUI() {
    "use strict";
    document.title = "Membership Admin";
    function log(text) {console.log(text);}
    var isRootVow = CapperConnect.home.post("isRoot");
    var C = CapperLayout;
    function link(text, url) {return C.jnode("a").text(text).attr("href", url);}
    var membersTable = C.jtable();
    function loadMembersTable() {
        CapperConnect.home.post("members").then(function(members){
            membersTable.empty();
            $.each(members, function(i, next) {
                next.post("data").then(function(memberData){
                    membersTable.append(C.jrow(
                        link(memberData.Name, next.webkey), memberData.Street
                    ));                    
                }, stderr("memberData"));
            });
        }, stderr("bad members"));
    }
    loadMembersTable();
    var addMemberName = C.jnode("input");
    var addMemberDiv = C.jdiv().append(
        "Add Member", addMemberName, C.jbutton("Add", function(){
            CapperConnect.home.post("addMember").then(function(newGuy){
                log("got new guy" + newGuy.webkey);                
                newGuy.post("setData", {Name: addMemberName.val()}).then(function(ok){
                    loadMembersTable();
                });
            }, stderr("addMember"));
        })
    );
    var memberToDeleteField = C.jnode("input");
    var memberDeleteBtn = C.jbutton("Delete Member", function(){
        var memberToDelete = CapperConnect.keyToProxy(memberToDeleteField.val());
        console.log(memberToDelete.webkey);
        memberToDeleteField.val("");
        CapperConnect.home.post("removeMember", memberToDelete).then(function(ok) {
            loadMembersTable();
        });
    });
    var deleteMemberDiv = C.jdiv().append(
        "Drag/Drop or Copy/Paste Member to Delete ", C.jbr(),
        memberToDeleteField, memberDeleteBtn
    );
    var readOnlySpan = C.jnode("span");
    CapperConnect.home.post("isReadOnly").then(function(isReadOnly){
        if (isReadOnly) {readOnlySpan.append(" ... (Read Only)");}
    });
    $(document.body).append(C.jnode("h3").append("Membership Admin").append(readOnlySpan),
        addMemberDiv, C.jbr(),
        "Members", C.jbr(),
        membersTable, C.jbr(),
        deleteMemberDiv, C.jbr(),
        C.jnode("hr"),
        makeDelegationMgr().div
    );

}
window.onload =loadAdminUI;