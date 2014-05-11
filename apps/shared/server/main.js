
function Shared(context) {
	"use strict";
    return Object.freeze( {
        state: context.state,
        temp: {}
    });
}
module.exports = Shared;
