void function () {
	'use strict';

	// Queue
	function Queue() {
		if (!(this instanceof Queue)) return new Queue();
		this.tail = this.head = undefined;
	}
	Queue.prototype.push = function push(x) {
		if (this.tail)
			this.tail = this.tail.next = {data:x, next:undefined};
		else
			this.tail = this.head = {data:x, next:undefined};
	};
	Queue.prototype.shift = function shift() {
		if (!this.head) return undefined;
		var x = this.head.data;
		this.head = this.head.next;
		if (!this.head) this.tail = undefined;
		return x;
	};

	if (typeof module === 'object' && module && module.exports)
		module.exports = Queue;
}();
