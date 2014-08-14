/*global console, document, CapperLayout, CapperConnect, stderr, $, setTimeout */
function makeDelegationMgr() {
    "use strict";
    var isRootVow = CapperConnect.home.post("isRoot");
    var C = CapperLayout;
    function link(text, url) {return C.jnode("a").text(text).attr("href", url);}
    var purposeField = C.jnode("input");
    var newDelegateField = C.jspan();
    var delegatesDiv = C.jdiv();
    function refreshDelegateList() {
        CapperConnect.home.post("delegates").then(function(delegates){
            delegatesDiv.empty();
            $.each(delegates, function(i,next){
                var entry = link(next[0], next[1].webkey);
                delegatesDiv.append(entry, C.jbr());
            });
        }, stderr("Could not get delegates"));
    }
    function addDelegation(){
        var purpose = purposeField.val();
        CapperConnect.home.post("makeDelegate", purpose, false).
        then(function(newDelegate){
            newDelegateField.append(link(purpose, newDelegate.webkey));
            refreshDelegateList();
        }, stderr("bad delegates retrieval"));
    }
    var revokeDiv = C.jdiv();
    var revokeStatus = C.jnode("span").text("|");
    isRootVow.then(function(isRoot){
        var killButton;
        var enableButton;
        var killEnabled = false;
        var statusText = "";
        function kill() {
            if (killEnabled) {
                CapperConnect.home.post("kill").then(function(ok) {
                    revokeStatus.text(statusText);
                }, stderr("kill person failed"));
            } else {
                revokeStatus.text("Must Enable before Revocation/Deletion");
            }        
        }
        function enableKill() {
            killEnabled = true;
            revokeStatus.text("Enabled");
            setTimeout(function(){killEnabled = false; revokeStatus.text("|");}, 5000);            
        }
        // go through complicated process of labeling all the items so that, if
        // this isRoot, user sees he is deleting; if not root, user sees he is revoking
        if (isRoot) {
            statusText = "Deleted";
            killButton = C.jbutton("Delete", kill);
            enableButton = C.jbutton("Enable Deletion", enableKill);
            revokeDiv.append("Delete: ", enableButton, " ... ", killButton);
        } else {
            statusText = "Revoked";
            killButton = C.jbutton("Revoke", kill);
            enableButton = C.jbutton("Enable Revocation", enableKill);
            revokeDiv.append("Revoke this Access", enableButton, " ... ", killButton);
        }
        revokeDiv.append(C.jbr(), revokeStatus);
    }, stderr("bad isRoot"));
    var div = C.jdiv().append(revokeDiv, C.jnode("p"),
        "Manage Delegations", C.jnode("p"),
        " Delegate to/for ", purposeField, C.jbutton("Add", addDelegation), C.jbr(),
        newDelegateField, C.jnode("p"),
        "Current Delegations", C.jbr(),
        delegatesDiv
    );
    refreshDelegateList();
    var mgr = {
        div: div,
        refresh: refreshDelegateList
    };
    return Object.freeze(mgr);
}