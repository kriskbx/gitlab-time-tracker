var extend = require('util-extend');

// Spinner types.
extend(Spinner, {
	Box1    : '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
	Box2    : '⠋⠙⠚⠞⠖⠦⠴⠲⠳⠓',
	Box3    : '⠄⠆⠇⠋⠙⠸⠰⠠⠰⠸⠙⠋⠇⠆',
	Box4    : '⠋⠙⠚⠒⠂⠂⠒⠲⠴⠦⠖⠒⠐⠐⠒⠓⠋',
	Box5    : '⠁⠉⠙⠚⠒⠂⠂⠒⠲⠴⠤⠄⠄⠤⠴⠲⠒⠂⠂⠒⠚⠙⠉⠁',
	Box6    : '⠈⠉⠋⠓⠒⠐⠐⠒⠖⠦⠤⠠⠠⠤⠦⠖⠒⠐⠐⠒⠓⠋⠉⠈',
	Box7    : '⠁⠁⠉⠙⠚⠒⠂⠂⠒⠲⠴⠤⠄⠄⠤⠠⠠⠤⠦⠖⠒⠐⠐⠒⠓⠋⠉⠈⠈',
	Spin1   : '|/-\\',
	Spin2   : '◴◷◶◵',
	Spin3   : '◰◳◲◱',
	Spin4   : '◐◓◑◒',
	Spin5   : '▉▊▋▌▍▎▏▎▍▌▋▊▉',
	Spin6   : '▌▄▐▀',
	Spin7   : '╫╪',
	Spin8   : '■□▪▫',
	Spin9   : '←↑→↓'
});

// Spinner.
function Spinner(){
	this.frames = [];
	this.length = 0;
	this.pos = 0;
}

// Set frames to the given string which must not use spaces.
Spinner.prototype.set = function(frames){
	this.frames = frames;
	this.length = this.frames.length;
}

// Next returns the next rune in the sequence.
Spinner.prototype.next = function(){
	var r = this.frames[this.pos%this.length]
	this.pos++
	return r
}

// Reset the spinner to its initial frame.
Spinner.prototype.reset = function(){
	this.pos = 0
}

// Returns a spinner initialized with Default frames.
module.exports = function(){
	var s = new Spinner();
	s.set(Spinner.Box1);
	return s
}