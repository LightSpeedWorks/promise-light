// PromiseLight

this.PromiseLight = function () {
	'use strict';

	var slice = [].slice;

	var extend = require('./extend-light');
	//var setValue = require('./set-value');
	var Queue = require('./enq3');
	//Queue.extend = extend;

	var nextExec = require('./next-exec');


	// PromiseLight
	var PromiseLight = extend({
		constructor: function PromiseLight(setup) {
			//if (!(this instanceof PromiseLight))
			//	throw new Error('new PromiseLight!!!');

			var thunk = this;
			thunk.que = new Queue;
			thunk.args = null;

			try{ setup(resolve, reject); }
			catch (err) { reject(err); }

			return;

			function resolve(val)     { return thunk.$$resolve(val); }
			function reject(err, val) { return thunk.$$reject(err, val); }

		}, // PromiseLight

		// PromiseLight#$$thunk
		$$thunk: function $$thunk(cb) {
			var p = new PromiseLightNext(this, undefined, undefined, cb);
			this.args && nextExec(this, this.$$fire);
			return p;
		}, // $$thunk

		// PromiseLight#then
		then: function then(resolve, reject) {
			var p = new PromiseLightNext(this, reject, resolve, undefined);
			this.args && nextExec(this, this.$$fire);
			return p;
		}, // then

		// PromiseLight#catch
		'catch': function caught(reject) {
			var p = new PromiseLightNext(this, reject, undefined, undefined);
			this.args && nextExec(this, this.$$fire);
			return p;
		}, // catch

		// PromiseLight#$$resolve
		$$resolve: function $$resolve(val) {
			//var thunk = this;
			//if (this.args) return this.args[0] ?
			//	console.log('resolved after rejected:', val, this.args[0]) :
			//	console.log('resolved twice:', val, this.args[1]);
			//this.args = [null, arguments.length < 2 ? val : slice.call(arguments)];
			this.args = [null, val, undefined, undefined];
			this.que.head && nextExec(this, this.$$fire);
		}, // resolve

		// PromiseLight#$$reject
		$$reject: function $$reject(err, val) {
			//var thunk = this;
			//if (this.args) return this.args[0] ?
			//	err ? console.log('rejected twice:', err, this.args[0]) :
			//	      console.log('resolved after rejected:', val, this.args[0]) :
			//	err ? console.log('rejected after resolved:', err, this.args[1]) :
			//	      console.log('resolved twice:', val, this.args[1]);
			this.args = [err, val]; //arguments;
			this.que.head && nextExec(this, this.$$fire);
		}, // reject

		// PromiseLight#$$fire
		$$fire: function $$fire() {
			var elem;
			while (elem = this.que.shift())
				fire(this.args[0], this.args[1], elem[0], elem[1], elem[2], elem[3]);
		}, // fire

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

	function fire(err, val, rej, res, cb, nxcb) {
		try {
			var r = //cb ? cb(err, val) :
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

	function isPromise(p) {
		return p instanceof PromiseLight || p instanceof Promise || (!!p && p.then);
	}

	function PromiseLightSolved(args) {
		var thunk = this;
		thunk.que = new Queue;
		thunk.args = args;
		return;
	} // PromiseLightSolved
	PromiseLightSolved.prototype = PromiseLight.prototype;

	function PromiseLightNext(parent, reject, resolve, cb) {
		var thunk = this;
		thunk.que = new Queue;
		thunk.args = null;
		parent.que.push([reject, resolve, cb, nxcb]);
		return;

		function nxcb(err, val)  { return thunk.$$reject(err, val); }
	} // PromiseLightNext
	PromiseLightNext.prototype = PromiseLight.prototype;

	function PromiseLightDefer() {
		var thunk = this;
		thunk.que = new Queue;
		thunk.args = null;
		return {promise: thunk, resolve: resolve, reject: reject};

		function resolve(val)     { return thunk.$$resolve(val); }
		function reject(err, val) { return thunk.$$reject(err, val); }
	} // PromiseLightDefer
	PromiseLightDefer.prototype = PromiseLight.prototype;


//	function log(x) { console.log('***', x); }

//console.log('PromiseLight 7 loading...');
//	PromiseLight.resolve('resolve 1').then(log, log);
//	PromiseLight.reject(new Error('reject 1')).then(log, log);
//	PromiseLight.all([PromiseLight.resolve('all 1')]).then(log, log);
//console.log('PromiseLight 7 loaded...');

	if (typeof module === 'object' && module && module.exports)
		module.exports = PromiseLight;

	return PromiseLight;

}();
