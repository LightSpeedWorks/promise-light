void function () {
	'use strict';

	// Queue
	function Queue() {
		//if (!(this instanceof Queue)) return new Queue();
		this.pos = this.len = 0;
	}
	Queue.prototype.push = function push(x) {
		this[this.len++] = x;
	};
	Queue.prototype.shift = function shift() {
		if (this.pos < this.len) {
			var x = this[this.pos];
			delete this[this.pos];
			this.pos++;
			return x;
		}
	};
	Queue.prototype.clear = function clear() {
		//console.log('enq1:', this.len);
		this.pos = this.len = 0;
	};

	if (typeof module === 'object' && module && module.exports)
		module.exports = Queue;
}();
