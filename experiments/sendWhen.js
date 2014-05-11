//whenobj
//context.same(remote1,remote2)
function makeRace(context) {
	var mem = context.state;
	var self = {
		start: function(car1, car2) {
			var vowPair = context.make("replyVow");
			car1.race().forward(self, "carFinished", car1, vowPair);
			car2.race().forward(self, "carFinished", car2, vowPair);
			return vowPair.replyVow;
		},
		carFinished: function(proof, ok, err, car, vowPair) {
			if (proof !== context) {return;}
			if (ok) {
				if (!vowPair.isResolved()) {
					vowPair.resolver.resolve(car);
					car.name().forward("winner");
				}
			}
		},
		winner: function(proof, name) {
			if (proof !== context) {return;)
			log ("and the winner is " + name);
		}
		
	}
}