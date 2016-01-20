// PromiseLight

this.PromiseLight = function () {
	'use strict';

	var slice = [].slice;

	var extend = require('./extend-light');
	//var setValue = require('./set-value');

	//var nextExec = require('./next-exec');
	var nextTickDo =
		typeof process === 'object' && process &&
		typeof process.nextTick === 'function' ? process.nextTick :
		typeof setImmediate === 'function' ? setImmediate :
		function nextTickDo(fn) { setTimeout(fn, 0); };

	// nextExec(ctx, fn)
	var nextExec = function () {
		// tasks {head, tail}
		var tasks = {head:undefined, tail:undefined};
		var progress = false;

		// nextExec(ctx, fn)
		function nextExec(ctx, fn) {
			var task = {ctx:ctx, fn:fn, chain:undefined};
			tasks.tail = tasks.tail ? (tasks.tail.chain = task) : (tasks.head = task);

			if (progress) return;
			progress = true;
			nextTickDo(nextTickExec);
		}

		function nextTickExec() {
			var task;
			while (task = tasks.head) {
				tasks.head = task.chain;
				if (!tasks.head) tasks.tail = undefined;

				var fn = task.fn;
				fn(task.ctx);
			}
			progress = false;
		}

		return nextExec;
	}(); // nextExec


	var PROMISE_FLAG_HANDLED = 1;
	var PROMISE_FLAG_UNHANDLED_REJECTION = 2;
	var PROMISE_FLAG_RESOLVED = 4;
	var PROMISE_FLAG_REJECTED = 8;
	var PROMISE_FLAG_SOLVED = PROMISE_FLAG_RESOLVED | PROMISE_FLAG_REJECTED;


	// PromiseLight
	var PromiseLight = extend({
		constructor: function PromiseLight(setup) {
			//if (!(this instanceof PromiseLight))
			//	throw new Error('new PromiseLight!!!');

			thunk.then     = then;
			thunk['catch'] = caught;
			thunk.toString = toString;
			thunk.flag = 0;
			thunk.tail = thunk.head = undefined;
			thunk.result = undefined;

			try{ setup(resolve, reject); }
			catch (err) { reject(err); }

			return thunk;

			function thunk(cb)    { return $$thunk(thunk, cb); }
			function resolve(val) { return $$resolve(thunk, val); }
			function reject(err)  { return $$reject(thunk, err); }
		}, // PromiseLight

		// PromiseLight#then
		then: then,

		// PromiseLight#catch
		'catch': caught, // catch

		// PromiseLight#toString
		toString: toString
	},

	{ // statics
		// PromiseLight.defer
		defer: function defer() {
			return new PromiseLightDefer();
		}, // defer

		isPromise: isPromise,

		// PromiseLight.all
		all: function all(promises) {
			//if (isIterator(promises)) promises = makeArrayFromIterator(promises);
			if (!(promises instanceof Array))
				throw new TypeError('promises must be an array');
			return new PromiseLight(
				function promiseAll(resolve, reject) {
					var n = promises.length;
					if (n === 0) return resolve([]);
					var res = Array(n);
					promises.forEach(function (p, i) {
						function complete(val) {
							res[i] = val; if (--n === 0) resolve(res); }
						if (p && p.then) //if (p instanceof PromiseLight || isPromise(p))
							return p.then(complete, reject);
						complete(p);
					}); // promises.forEach
				}
			); // return new Promise
		}, // all

		//PromiseLight.resolve
		resolve: function resolve(val) {
			return new PromiseLightSolved(PROMISE_FLAG_RESOLVED, val);
		},
		//PromiseLight.reject
		reject: function reject(err) {
			return new PromiseLightSolved(PROMISE_FLAG_REJECTED, err);
		}
	}); // PromiseLight

	function toString() {
		return 'PromLit { ' + JSON.stringify(this.result) + ' }';
	}

	function then(resolve, reject) {
		var p = new PromiseLightNext(this, reject, resolve, undefined);
		if (this.flag & PROMISE_FLAG_SOLVED) nextExec(this, $$fire);
		return p;
	}

	function caught(reject) {
		var p = new PromiseLightNext(this, reject, undefined, undefined);
		if (this.flag & PROMISE_FLAG_SOLVED) nextExec(this, $$fire);
		return p;
	}

	// $$thunk
	function $$thunk(thunk, cb) {
		var p = new PromiseLightNext(thunk, undefined, undefined, cb);
		if (thunk.flag & PROMISE_FLAG_SOLVED) nextExec(thunk, $$fire);
		return p;
	} // $$thunk

	// $$resolve
	function $$resolve(thunk, val) {
		//if (thunk.args) return thunk.args[0] ?
		//	console.log('resolved after rejected:', val, thunk.args[0]) :
		//	console.log('resolved twice:', val, thunk.args[1]);
		//thunk.args = [null, arguments.length <= 2 ? val : slice.call(arguments, 1)];
		thunk.result = val;
		thunk.flag |= PROMISE_FLAG_RESOLVED;
		if (thunk.head) nextExec(thunk, $$fire);
	} // $$resolve

	// $$reject
	function $$reject(thunk, err) {
		//if (thunk.args) return thunk.args[0] ?
		//	err ? console.log('rejected twice:', err, thunk.args[0]) :
		//	      console.log('resolved after rejected:', val, thunk.args[0]) :
		//	err ? console.log('rejected after resolved:', err, thunk.args[1]) :
		//	      console.log('resolved twice:', val, thunk.args[1]);
		thunk.result = err;
		thunk.flag |= PROMISE_FLAG_REJECTED;
		if (thunk.head) nextExec(thunk, $$fire);
		else nextExec(thunk, $$checkUnhandledRejection);
	} // $$reject

	// $$callback
	function $$callback(thunk, err, val) {
		//if (thunk.args) return thunk.args[0] ?
		//	err ? console.log('rejected twice:', err, thunk.args[0]) :
		//	      console.log('resolved after rejected:', val, thunk.args[0]) :
		//	err ? console.log('rejected after resolved:', err, thunk.args[1]) :
		//	      console.log('resolved twice:', val, thunk.args[1]);
		if (err) {
			thunk.result = err;
			thunk.flag |= PROMISE_FLAG_REJECTED;
		}
		else {
			thunk.result = val;
			thunk.flag |= PROMISE_FLAG_RESOLVED;
		}
		if (thunk.head) nextExec(thunk, $$fire);
		else if (err) nextExec(thunk, $$checkUnhandledRejection);
	} // $$callback

	// $$fire
	function $$fire(thunk) {
		var bomb;
		while (bomb = thunk.head) {
			thunk.head = bomb.chain;
			if (!thunk.head) thunk.tail = undefined;

			fire(thunk, thunk.result, bomb.rej, bomb.res, bomb.cb);
		}
		if (thunk.flag & PROMISE_FLAG_REJECTED) nextExec(thunk, $$checkUnhandledRejection);
	} // $$fire

	function fire(thunk, result, rej, res, cb) {
		var err, val;
		if (thunk.flag & PROMISE_FLAG_REJECTED) err = result;
		else val = result;
		try {
			var r = cb ? cb(err, val) :
				err ? (rej ? rej(err) : err) :
				res ? res(val) : undefined;
			if (r && r.then)
				r.then(function (v) { return $$resolve(thunk, v); },
					function (e) { return $$reject(thunk, e); });
			else if (typeof r === 'function')
				r(function (e, v) { return $$callback(thunk, e, v); });
			else if (r instanceof Error) $$reject(thunk, r);
			else $$resolve(thunk, r);

			if ((thunk.flag & PROMISE_FLAG_UNHANDLED_REJECTION) &&
				!(thunk.flag & PROMISE_FLAG_HANDLED))
				$$rejectionHandled(thunk);
			thunk.flag |= PROMISE_FLAG_HANDLED;
		} catch (e) { $$reject(thunk, e); }
	} // fire

	// $$checkUnhandledRejection
	function $$checkUnhandledRejection(thunk) {
		if (!(thunk.flag & PROMISE_FLAG_HANDLED)) {
			if (!(thunk.flag & PROMISE_FLAG_UNHANDLED_REJECTION))
				$$unhandledRejection(thunk);
			thunk.flag |= PROMISE_FLAG_UNHANDLED_REJECTION;
		}
	} // checkUnhandledRejection

	// $$unhandledRejection
	function $$unhandledRejection(thunk) {
		process.emit('unhandledRejection', thunk.result, thunk);
		console.log('UNHANDLED REJECTION!?');
	} // unhandledRejection

	// $$rejectionHandled
	function $$rejectionHandled(thunk) {
		process.emit('rejectionHandled', thunk);
		console.log('UNHANDLED REJECTION HANDLED!?');
	} // rejectionHandled

	function isPromise(p) {
		return p instanceof PromiseLight || p instanceof Promise || (!!p && p.then);
	}

	function PromiseLightSolved(flag, result) {
		thunk.then     = then;
		thunk['catch'] = caught;
		thunk.toString = toString;
		thunk.flag = flag;
		thunk.tail = thunk.head = undefined;
		thunk.result = result;
		if (flag & PROMISE_FLAG_REJECTED) nextExec(thunk, $$fire);
		return thunk;

		function thunk(cb)    { return $$thunk(thunk, cb); }
	} // PromiseLightSolved
	PromiseLightSolved.prototype = PromiseLight.prototype;

	function PromiseLightNext(parent, reject, resolve, cb) {
		thunk.then     = then;
		thunk['catch'] = caught;
		thunk.toString = toString;
		thunk.flag = 0;
		thunk.tail = thunk.head = undefined;
		thunk.result = undefined;

		var bomb = {rej:reject, res:resolve, cb:cb, chain:undefined};
		parent.tail = parent.tail ? (parent.tail.chain = bomb) : (parent.head = bomb);

		return thunk;

		function thunk(cb)    { return $$thunk(thunk, cb); }
	} // PromiseLightNext
	PromiseLightNext.prototype = PromiseLight.prototype;

	function PromiseLightDefer() {
		thunk.then     = then;
		thunk['catch'] = caught;
		thunk.toString = toString;
		thunk.flag = 0;
		thunk.tail = thunk.head = undefined;
		thunk.result = undefined;
		return {promise: thunk, resolve: resolve, reject: reject};

		function thunk(cb)    { return $$thunk(thunk, cb); }
		function resolve(val) { return $$resolve(thunk, val); }
		function reject(err)  { return $$reject(thunk, err); }
	} // PromiseLightDefer
	PromiseLightDefer.prototype = PromiseLight.prototype;


	/*
	var p1 = PromiseLight.reject(new Error);
	setTimeout(function () {
		p1.catch(function () {});
	}, 1);
	var p2 = PromiseLight.reject(new Error).then(function () {});
	setTimeout(function () {
		p2.catch(function () {});
	}, 1);
	*/


	if (typeof module === 'object' && module && module.exports)
		module.exports = PromiseLight;

	return PromiseLight;

}();
