void function () {
	'use strict';

	// Queue
	function Queue() {
		//if (!(this instanceof Queue)) return new Queue();
		this.pos = this.len = 0;
		this.que = [];
	}
	Queue.prototype.push = function push(x) {
		this.que[this.len++] = x;
	};
	Queue.prototype.shift = function shift() {
		if (this.pos < this.len) {
			var x = this.que[this.pos];
			this.que[this.pos] = undefined;
			this.pos++;
			//if (this.pos === this.len) this.clear();
			return x;
		}
	};
	Queue.prototype.clear = function clear() {
		//console.log('enq2:', this.len);
		this.pos = this.len = 0;
		this.que = [];
	};

	if (typeof module === 'object' && module && module.exports)
		module.exports = Queue;
}();
