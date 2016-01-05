// next-exec.js

void function () {
	'use strict';

	var nextTickDo =
		typeof process === 'object' && process &&
		typeof process.nextTick === 'function' ? process.nextTick :
		typeof setImmediate === 'function' ? setImmediate :
		function nextTickDo(fn) { setTimeout(fn, 0); };

	var Queue = require('./enq3');
	var tasks = new Queue();
	var nextExecProgress = false;

	// nextExec(ctx, fn)
	function nextExec(ctx, fn) {
		tasks.push({ctx:ctx, fn:fn, next_obj:undefined});
		//tasks.push(arguments);

		if (nextExecProgress) return;
		nextExecProgress = true;

		nextTickDo(function () {
			var task;

			while (task = tasks.shift())
				task.fn.call(task.ctx);
				//task[1].call(task[0]);

			tasks.clear();
			nextExecProgress = false;
		});
	}

/*
	// nextTick2(fn, args,...)
	var nextTick2 = function () {
		var NEXT_MAX = 50;
		var count = 0;
		var progress = false;
		var head = undefined;
		var tail = undefined;

		function nextTick2() { // cb, err, val,...
			if (head)
				return tail = tail.next_next = arguments;
			head = tail = arguments;
			if (progress) return;
			progress = true;
			++count >= NEXT_MAX ? (count = 0, nextTickDo(nextTask)) : nextTask();
		}

		var argscbs = [
			function (args) { return undefined; },
			function (args) { return args[0](); },
			function (args) { return args[0](args[1]); },
			function (args) { return args[0](args[1], args[2]); },
			function (args) { return args[0](args[1], args[2], args[3]); },
			function (args) { return args[0](args[1], args[2], args[3], args[4]); }
		];

		function nextTask() {
			while (head) {
				var args = head;
				if (head === tail)
					head = tail = undefined;
				else
					head = head.next_next;
				argscbs[args.length](args);
			}
			progress = false;
		}

		nextTick2.nextTickDo = nextTickDo;
		nextTick2.nextTick2 = nextTick2;

		return nextTick2;
	}();
*/

	if (typeof module === 'object' && module && module.exports)
		module.exports = nextExec;

}();
