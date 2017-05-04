var Spinner = require('./index.js');
var s = Spinner();

setInterval(function(){
	process.stdout.write('\r \033[36mcomputing\033[m ' + s.next());
}, 250);