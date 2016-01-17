void function () {
	'use strict';

	// Queue
	function Queue() {
		//if (!(this instanceof Queue)) return new Queue();
		this.tail = this.head = undefined;
	}
	Queue.prototype.push = function push(x) {
		this.tail = this.tail ? (this.tail.next_obj = x) : (this.head = x);
	};
	Queue.prototype.shift = function shift() {
		if (!this.head) return undefined;
		var x = this.head;
		this.head = x.next_obj;
		if (!this.head) this.tail = undefined;
		return x;
	};
	Queue.prototype.clear = function clear() {
		this.tail = this.head = undefined;
	};

	if (typeof module === 'object' && module && module.exports)
		module.exports = Queue;
}();
