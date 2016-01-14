// PromiseLight

this.PromiseLight = function () {
	'use strict';

	var slice = [].slice;

	var extend = require('./extend-light');
	//var setValue = require('./set-value');

	// TODO other class

	//var nextExec = require('./next-exec');
	var nextTickDo =
		typeof process === 'object' && process &&
		typeof process.nextTick === 'function' ? process.nextTick :
		typeof setImmediate === 'function' ? setImmediate :
		function nextTickDo(fn) { setTimeout(fn, 0); };

	var Queue = require('./enq3');
	var nextExecTasks = new Queue();
	var nextExecProgress = false;

	// nextExec(ctx, fn)
	function nextExec(ctx, fn) {
		nextExecTasks.push({ctx:ctx, fn:fn, next_obj:undefined});

		if (nextExecProgress) return;
		nextExecProgress = true;

		nextTickDo(function () {
			var task;

			while (task = nextExecTasks.shift())
				task.fn(task.ctx);

			//nextExecTasks.clear();
			nextExecProgress = false;
		});
	}


	// PromiseLight
	var PromiseLight = extend({
		constructor: function PromiseLight(setup) {
			//if (!(this instanceof PromiseLight))
			//	throw new Error('new PromiseLight!!!');

			var thunk = this;
			thunk.tail = thunk.head = undefined;
			thunk.args = null;

			try{ setup(resolve, reject); }
			catch (err) { reject(err); }

			return;

			function resolve(val)     { return $$resolve(thunk, val); }
			function reject(err, val) { return $$reject(thunk, err, val); }

		}, // PromiseLight

		// PromiseLight#then
		then: function then(resolve, reject) {
			var p = new PromiseLightNext(this, reject, resolve, undefined);
			this.args && nextExec(this, $$fire);
			return p;
		}, // then

		// PromiseLight#catch
		'catch': function caught(reject) {
			var p = new PromiseLightNext(this, reject, undefined, undefined);
			this.args && nextExec(this, $$fire);
			return p;
		}, // catch

		// PromiseLight#toString
		toString: function toString() {
			return 'PromLit { ' + JSON.stringify(this.args) + ' }';
		} // toString
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
			return new PromiseLightSolved([null, val]);
		},
		//PromiseLight.reject
		reject: function reject(err) {
			return new PromiseLightSolved([err]);
		}
	}); // PromiseLight


	// resolve
	function $$resolve(thunk, val) {
		//if (thunk.args) return thunk.args[0] ?
		//	console.log('resolved after rejected:', val, thunk.args[0]) :
		//	console.log('resolved twice:', val, thunk.args[1]);
		//thunk.args = [null, arguments.length <= 2 ? val : slice.call(arguments, 1)];
		thunk.args = [null, val];
		thunk.head && nextExec(thunk, $$fire);
	} // resolve

	// reject
	function $$reject(thunk, err, val) {
		//if (thunk.args) return thunk.args[0] ?
		//	err ? console.log('rejected twice:', err, thunk.args[0]) :
		//	      console.log('resolved after rejected:', val, thunk.args[0]) :
		//	err ? console.log('rejected after resolved:', err, thunk.args[1]) :
		//	      console.log('resolved twice:', val, thunk.args[1]);
		thunk.args = [err, val];
		thunk.head && nextExec(thunk, $$fire);
	} // reject


	// $$thunk
	function $$thunk(thunk, cb) {
		var p = new PromiseLightNext(thunk, undefined, undefined, cb);
		thunk.args && nextExec(thunk, $$fire);
		return p;
	} // $$thunk


	// $$fire
	function $$fire(thunk) {
		while (thunk.head) {
			var bomb = $$deq(thunk);
			fire(thunk.args[0], thunk.args[1], bomb.rej, bomb.res, bomb.cb, bomb.nxcb);
		}
	} // fire


	function fire(err, val, rej, res, cb, nxcb) {
		try {
			var r = cb ? cb(err, val) :
				err ? (rej ? rej(err) : err) :
				res ? res(val) :
				undefined;
			if (r && r.then)
				r.then(function (v) { return nxcb(null, v); }, nxcb);
			else if (typeof r === 'function') r(nxcb);
			else if (r instanceof Error) nxcb(r);
			else nxcb(null, r);
		} catch (e) { nxcb(e); }
	} // fire



	// $$enq
	function $$enq(thunk, bomb) {
		thunk.tail = thunk.tail ? (thunk.tail.chain = bomb) : (thunk.head = bomb);
	} // $$enq

	// $$deq
	function $$deq(thunk) {
		var bomb = thunk.head;
		if (!bomb) return undefined;
		thunk.head = bomb.chain;
		if (!thunk.head) thunk.tail = undefined;
		return bomb;
	} // $$deq


	function isPromise(p) {
		return p instanceof PromiseLight || p instanceof Promise || (!!p && p.then);
	}

	function PromiseLightSolved(args) {
		var thunk = this;
		thunk.tail = thunk.head = undefined;
		thunk.args = args;
		return;
	} // PromiseLightSolved
	PromiseLightSolved.prototype = PromiseLight.prototype;

	function PromiseLightNext(parent, reject, resolve, cb) {
		var thunk = this;
		thunk.tail = thunk.head = undefined;
		thunk.args = null;
		$$enq(parent, {rej:reject, res:resolve, cb:cb, nxcb:nxcb, chain:undefined});
		return;

		function nxcb(err, val)  { return $$reject(thunk, err, val); }
	} // PromiseLightNext
	PromiseLightNext.prototype = PromiseLight.prototype;

	function PromiseLightDefer() {
		var thunk = this;
		thunk.tail = thunk.head = undefined;
		thunk.args = null;
		return {promise: thunk, resolve: resolve, reject: reject};

		function resolve(val)     { return $$resolve(thunk, val); }
		function reject(err, val) { return $$reject(thunk, err, val); }
	} // PromiseLightDefer
	PromiseLightDefer.prototype = PromiseLight.prototype;


	if (typeof module === 'object' && module && module.exports)
		module.exports = PromiseLight;

	return PromiseLight;

}();
