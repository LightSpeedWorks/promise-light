// Promise

void function (PromiseOrg) {
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
				task.chain = undefined;
				if (!tasks.head) tasks.tail = undefined;

				var fn = task.fn;
				fn(task.ctx);
			}
			progress = false;
		}

		return nextExec;
	}(); // nextExec


	var PROMISE_FLAG_RESOLVED = 1;
	var PROMISE_FLAG_REJECTED = 2;
	var PROMISE_FLAG_SOLVED = PROMISE_FLAG_RESOLVED | PROMISE_FLAG_REJECTED;
	var PROMISE_FLAG_HANDLED = 4;
	var PROMISE_FLAG_UNHANDLED_REJECTION = 8;


	// Promise
	var Promise = extend({
		constructor: function Promise(setup) {
			if (!(this instanceof Promise))
				throw new TypeError('new Promise!!!');

			var thunk = this;
			thunk.flag = 0;
			thunk.tail = thunk.head = undefined;
			thunk.result = undefined;

			try { setup(resolve, reject); }
			catch (err) { reject(err); }

			return thunk;

			function resolve(val) { return $$resolve(thunk, val); }
			function reject(err)  { return $$reject(thunk, err); }
		}, // Promise

		// Promise#then
		then: then,

		// Promise#catch
		'catch': caught, // catch

		// Promise#toString
		toString: toString
	},

	{ // statics
		// Promise.defer
		defer: function defer() {
			return new PromiseDefer();
		}, // defer

		// Promise.all([p, ...])
		all: function all(promises) {
			if (isIterator(promises)) promises = makeArrayFromIterator(promises);
			if (!(promises instanceof Array))
				throw new TypeError('promises must be an array');
			return new Promise(
				function promiseAll(resolve, reject) {
					var n = promises.length;
					if (n === 0) return resolve([]);
					var res = Array(n);
					promises.forEach(function (p, i) {
						function complete(val) {
							res[i] = val; if (--n === 0) resolve(res); }
						if (p && p.then) //if (p instanceof Promise || isPromise(p))
							return p.then(complete, reject);
						complete(p);
					}); // promises.forEach
				}
			); // return new Promise
		}, // all

		// Promise.race([p, ...])
		race: function race(promises) {
			if (isIterator(promises)) promises = makeArrayFromIterator(promises);
			if (!(promises instanceof Array))
				throw new TypeError('promises must be an array');

			return new Promise(
				function promiseRace(resolve, reject) {
					promises.forEach(function (p) {
						if (p instanceof Promise || isPromise(p))
							return p.then(resolve, reject);
						resolve(p);
					}); // promises.forEach
				}
			); // return new Promise
		}, // race

		isIterable: isIterable,
		isIterator: isIterator,
		isPromise: isPromise,
		makeArrayFromIterator: makeArrayFromIterator,

		resolve: resolve,
		reject: reject,
		accept: resolve
	}); // Promise

	// Promise.resolve
	function resolve(val) {
		if (val && val.then) return val;
		return new PromiseSolved(PROMISE_FLAG_RESOLVED, val);
	}

	// Promise.reject
	function reject(err) {
		return new PromiseSolved(PROMISE_FLAG_REJECTED, err);
	}

	// Promise#toString()
	function toString() {
		return 'PromiseLight { ' + this.result + ' }';
	}

	// Promise#then(resolve, reject)
	function then(resolve, reject) {
		return new PromiseNext(this, reject, resolve, undefined);
	}

	// Promise#catch(reject)
	function caught(reject) {
		return new PromiseNext(this, reject, undefined, undefined);
	}

	// $$thunk
	function $$thunk(thunk, cb) {
		return new PromiseNext(thunk, undefined, undefined, cb);
	}

	// $$resolve
	function $$resolve(thunk, val) {
		if (thunk.flag & PROMISE_FLAG_SOLVED) return;
		//if (thunk.args) return thunk.args[0] ?
		//	console.log('resolved after rejected:', val, thunk.args[0]) :
		//	console.log('resolved twice:', val, thunk.args[1]);
		//thunk.args = [null, arguments.length <= 2 ? val : slice.call(arguments, 1)];

		if (val && val.then)
			return val.then(
				function (v) { return $$resolve(thunk, v); },
				function (e) { return $$reject(thunk, e); });

		thunk.result = val;
		thunk.flag |= PROMISE_FLAG_RESOLVED;
		if (thunk.head) nextExec(thunk, $$fire);
	} // $$resolve

	// $$reject
	function $$reject(thunk, err) {
		if (thunk.flag & PROMISE_FLAG_SOLVED) return;
		//if (thunk.args) return thunk.args[0] ?
		//	err ? console.log('rejected twice:', err, thunk.args[0]) :
		//	      console.log('resolved after rejected:', val, thunk.args[0]) :
		//	err ? console.log('rejected after resolved:', err, thunk.args[1]) :
		//	      console.log('resolved twice:', val, thunk.args[1]);
		thunk.result = err;
		thunk.flag |= PROMISE_FLAG_REJECTED;
		nextExec(thunk, $$fire);
	} // $$reject

	// $$callback
	function $$callback(thunk, err, val) {
		if (thunk.flag & PROMISE_FLAG_SOLVED) return;
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
		if (thunk.head || err) nextExec(thunk, $$fire);
	} // $$callback

	// $$fire
	function $$fire(thunk) {
		if (thunk.flag & PROMISE_FLAG_REJECTED) var err = thunk.result;
		else var val = thunk.result;
		var bomb, handled = false;
		while (bomb = thunk.head) {
			if (bomb.cb || bomb.rej) handled = true;
			thunk.head = bomb.chain;
			bomb.chain = undefined;
			if (!thunk.head) thunk.tail = undefined;

			fire(bomb.thunk, err, val, bomb.rej, bomb.res, bomb.cb);
		}

		if (handled && (thunk.flag & PROMISE_FLAG_UNHANDLED_REJECTION) &&
			!(thunk.flag & PROMISE_FLAG_HANDLED))
			$$rejectionHandled(thunk);
		if (handled) thunk.flag |= PROMISE_FLAG_HANDLED;

		if (thunk.flag & PROMISE_FLAG_REJECTED)
			nextExec(thunk, $$checkUnhandledRejection);
	} // $$fire

	function fire(thunk, err, val, rej, res, cb) {
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

	// isPromise(p)
	function isPromise(p) {
		return p instanceof Promise || p instanceof PromiseOrg || (!!p && p.then);
	}

	// isIterator(iter)
	function isIterator(iter) {
		return !!iter && (typeof iter.next === 'function' || isIterable(iter));
	}

	// isIterable(iter)
	function isIterable(iter) {
		return !!iter && typeof Symbol === 'function' &&
			!!Symbol.iterator && typeof iter[Symbol.iterator] === 'function';
	}

	// makeArrayFromIterator(iter or array)
	function makeArrayFromIterator(iter) {
		if (iter instanceof Array) return iter;
		if (!isIterator(iter)) return [iter];
		if (isIterable(iter)) iter = iter[Symbol.iterator]();
		var array = [];
		try {
			for (;;) {
				var val = iter.next();
				if (val && val.hasOwnProperty('done') && val.done) return array;
				if (val && val.hasOwnProperty('value')) val = val.value;
				array.push(val);
			}
		} catch (error) {
			return array;
		}
	} // makeArrayFromIterator

	function PromiseSolved(flag, result) {
		var thunk = this;
		thunk.flag = flag;
		thunk.tail = thunk.head = undefined;
		thunk.result = result;
		if (flag & PROMISE_FLAG_REJECTED) nextExec(thunk, $$fire);
		return thunk;
	} // PromiseSolved
	PromiseSolved.prototype = Promise.prototype;

	function PromiseNext(parent, reject, resolve, cb) {
		var thunk = this;
		thunk.flag = 0;
		thunk.tail = thunk.head = undefined;
		thunk.result = undefined;

		var bomb = {rej:reject, res:resolve, cb:cb, thunk:thunk, chain:undefined};
		parent.tail = parent.tail ? (parent.tail.chain = bomb) : (parent.head = bomb);
		if (parent.flag & PROMISE_FLAG_SOLVED) nextExec(parent, $$fire);

		return thunk;
	} // PromiseNext
	PromiseNext.prototype = Promise.prototype;

	function PromiseDefer() {
		var thunk = this;
		thunk.flag = 0;
		thunk.tail = thunk.head = undefined;
		thunk.result = undefined;
		return {promise:thunk, resolve:resolve, reject:reject};

		function resolve(val) { return $$resolve(thunk, val); }
		function reject(err)  { return $$reject(thunk, err); }
	} // PromiseDefer
	PromiseDefer.prototype = Promise.prototype;


	/*
	var p1 = Promise.reject(new Error);
	setTimeout(function () {
		p1.catch(function () {});
	}, 1);
	var p2 = Promise.reject(new Error).then(function () {});
	setTimeout(function () {
		p2.catch(function () {});
	}, 1);
	*/


	if (typeof module === 'object' && module && module.exports)
		module.exports = Promise;

	return Promise;

}(typeof Promise === 'function' ? Promise : null);
