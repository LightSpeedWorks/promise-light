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
	var PromiseLight = extend({
		constructor: function PromiseLight(setup) {
			//if (!(this instanceof PromiseLight))
			//	throw new Error('new PromiseLight!!!');

			this.pos = this.len = 0;
			//Queue.call(this);
			this.args = null;

			var that = this;
			try{ setup(resolve, reject); }
			catch (err) { this.$$reject(err); }

			return;

			function resolve(val)     { return that.$$resolve(val); }
			function reject(err, val) { return that.$$reject(err, val); }

		}, // PromiseLight

		// PromiseLight#then
		//PromiseLight.prototype.then = function then(resolve, reject) {
		then: function then(resolve, reject) {
			this[this.len++] = cb;
			var p = new PromiseLightNext(cb); //(function (resolve, reject) { cb.next_cb = reject; });
			this.args && nextExec(this, this.$$fire);
			return p;

			function cb(err, val) {
				return err ? reject ? reject(err) : err : resolve ? resolve(val) : undefined;
			}
		}, // then

		// PromiseLight#catch
		//PromiseLight.prototype['catch'] = function caught(reject) {
		'catch': function caught(reject) {
			this[this.len++] = cb;
			var p = new PromiseLightNext(cb); //(function (resolve, reject) { cb.next_cb = reject; });
			this.args && nextExec(this, $$fire);
			return p;

			function cb(err, val) {
				return err ? reject ? reject(err) : err : undefined;
			}
		}, // catch

		// PromiseLight#$$resolve
		//PromiseLight.prototype.$$resolve = function $$resolve(val) {
		$$resolve: function $$resolve(val) {
			//var that = this;
			//if (this.args) return this.args[0] ?
			//	console.log('resolved after rejected:', val, this.args[0]) :
			//	console.log('resolved twice:', val, this.args[1]);
			//this.args = [null, arguments.length < 2 ? val : slice.call(arguments)];
			this.args = [null, val];
			this.pos < this.len && nextExec(this, this.$$fire);
		}, // resolve

		// PromiseLight#$$reject
		//PromiseLight.prototype.$$reject = function $$reject(err, val) {
		$$reject: function $$reject(err, val) {
			//var that = this;
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
				var cb = this[this.pos], next = cb.next_cb;
				(function (args, cb, next) {
					try {
						//var r = cb.apply(null, args);
						var r = cb(args[0], args[1]);
						if (r && r.then) r.then(function (v) { next(null, v); }, next);
						else if (typeof r === 'function') r(next);
						else if (r instanceof Error) next(r);
						else next(null, r);
					} catch (e) { next(e); }
				})(this.args, cb, next);
				this[this.pos] = undefined;
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
			var resolve, reject;
			var p = new PromiseLight(function (res, rej) { resolve = res; reject = rej; });
			return {promise: p, resolve: resolve, reject: reject};
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
			//return new PromiseLight(function (res, rej) { res(val); });
		},
		//PromiseLight.reject
		reject: function reject(err) {
			return new PromiseLightSolved([err]);
			//return new PromiseLight(function (res, rej) { rej(err); });
		}
	}); // PromiseLight

	function isPromise(p) {
		return p instanceof PromiseLight || p instanceof Promise || (!!p && p.then);
	}

	var PromiseLightSolved = PromiseLight.extend({
		constructor: function PromiseLightSolved(args) {
			this.pos = this.len = 0;
			this.args = args;
			return;
		} // PromiseLightSolved
	});

	var PromiseLightNext = PromiseLight.extend({
		constructor: function PromiseLightNext(cb) {
			this.pos = this.len = 0;
			this.args = null;
			cb.next_cb = reject;
			var that = this;
			return;

			function reject(err, val)  { return that.$$reject(err, val); }
		} // PromiseLightNext
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
