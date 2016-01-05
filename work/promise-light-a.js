// PromiseLight

this.PromiseLight = function () {
	'use strict';

	var slice = [].slice;

	var extend = require('./extend-light');
	//var setValue = require('./set-value');
	//var Queue = require('./enq');
	//Queue.extend = extend;

	var nextExec = require('./next-exec');


	// PromiseLight
	var PromiseLight = extend.call(Function, {
		constructor: function PromiseLight(setup) {
			//if (!(this instanceof PromiseLight))
			//	throw new Error('new PromiseLight!!!');

			thunk.pos = thunk.len = 0;
			thunk.que = [];
			thunk.args = null;

			//var thunk = this;
			try{ setup(resolve, reject); }
			catch (err) { reject(err); }

			Object.setPrototypeOf(thunk, PromiseLight.prototype);
			return thunk;

			function thunk(cb)        { return thunk.$$thunk(cb); }
			function resolve(val)     { return thunk.$$resolve(val); }
			function reject(err, val) { return thunk.$$reject(err, val); }

		}, // PromiseLight

		// PromiseLight#$$thunk
		$$thunk: function $$thunk(cb) {
			var elem = [undefined, undefined, cb, undefined];
			this.que[this.len++] = elem;
			var p = new PromiseLightNext(elem);
			this.args && nextExec(this, this.$$fire);
			return p;
		}, // $$thunk

		// PromiseLight#then
		then: function then(resolve, reject) {
			var elem = [reject, resolve, undefined, undefined];
			this.que[this.len++] = elem;
			var p = new PromiseLightNext(elem);
			this.args && nextExec(this, this.$$fire);
			return p;
		}, // then

		// PromiseLight#catch
		'catch': function caught(reject) {
			var elem = [reject, undefined, undefined, undefined];
			this.que[this.len++] = elem;
			var p = new PromiseLightNext(elem);
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
			this.pos < this.len && nextExec(this, this.$$fire);
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
			this.pos < this.len && nextExec(this, this.$$fire);
		}, // reject

		// PromiseLight#$$fire
		$$fire: function $$fire() {
			for (; this.pos < this.len; ++this.pos) {
				var elem = this.que[this.pos];
				(function (args, rej, res, cb, nxcb) {
					try {
						var r = cb ? cb(args[0], args[1]) :
							args[0] && rej ? rej(args[0]) :
							args[0] ? args[0] :
							res ? res(args[1]) :
							undefined;
						if (r && r.then)
							r.then(function (v) { return nxcb(null, v); }, nxcb);
						else if (typeof r === 'function') r(nxcb);
						else if (r instanceof Error) nxcb(r);
						else nxcb(null, r);
					} catch (e) { nxcb(e); }
				})(this.args, elem[0], elem[1], elem[2], elem[3]);
				this.que[this.pos] = undefined;
			}
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

	function isPromise(p) {
		return p instanceof PromiseLight || p instanceof Promise || (!!p && p.then);
	}

	var PromiseLightSolved = PromiseLight.extend({
		constructor: function PromiseLightSolved(args) {
			this.pos = this.len = 0;
			this.que = [];
			this.args = args;
			return;
		} // PromiseLightSolved
	});

	var PromiseLightNext = PromiseLight.extend({
		constructor: function PromiseLightNext(elem) {
			this.pos = this.len = 0;
			this.que = [];
			this.args = null;
			elem[3] = nxcb;
			var thunk = this;
			return;

			function nxcb(err, val)  { return thunk.$$reject(err, val); }
		} // PromiseLightNext
	});

	var PromiseLightDefer = PromiseLight.extend({
		constructor: function PromiseLightDefer() {
			this.pos = this.len = 0;
			this.que = [];
			this.args = null;
			var thunk = this;
			return {promise: this, resolve: resolve, reject: reject};

			function resolve(val)     { return thunk.$$resolve(val); }
			function reject(err, val) { return thunk.$$reject(err, val); }
		} // PromiseLightDefer
	});


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
