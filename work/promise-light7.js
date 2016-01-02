// PromiseLight

this.PromiseLight = function () {
	'use strict';

	var slice = [].slice;

	var nextTick = require('./next-tick'); //.nextTickDo;


	// PromiseLight
	function PromiseLight(setup) {
		//if (!(this instanceof PromiseLight))
		//	throw new Error('new PromiseLight!!!');

		this.pos = this.len = 0;
		this.args = null;

		var that = this;
		try{ setup(resolve, reject); }
		catch (err) { this.$$reject(err); }

//console.log('PL7: ', this, __filename);////////////////////////////////

		return;

		function resolve(val)     { return that.$$resolve(val); }
		function reject(err, val) { return that.$$reject(err, val); }

	} // PromiseLight

	// PromiseLight#then
	PromiseLight.prototype.then = function then(resolve, reject) {
		this[this.len++] = cb;
		var p = new PromiseLightNext(cb); //(function (resolve, reject) { cb.next_cb = reject; });
		var that = this;
		this.args && nextTick(function fire() { that.$$fire(); });
		return p;

		function cb(err, val) {
			return err ? reject ? reject(err) : err : resolve ? resolve(val) : undefined;
		}
	}; // then

	// PromiseLight#catch
	PromiseLight.prototype['catch'] = function caught(reject) {
		this[this.len++] = cb;
		var p = new PromiseLightNext(cb); //(function (resolve, reject) { cb.next_cb = reject; });
		var that = this;
		this.args && nextTick(function fire() { that.$$fire(); });
		return p;

		function cb(err, val) {
			return err ? reject ? reject(err) : err : undefined;
		}
	}; // catch

	// PromiseLight#$$resolve
	PromiseLight.prototype.$$resolve = function $$resolve(val) {
		var that = this;
		//if (this.args) return this.args[0] ?
		//	console.log('resolved after rejected:', val, this.args[0]) :
		//	console.log('resolved twice:', val, this.args[1]);
		//this.args = [null, arguments.length < 2 ? val : slice.call(arguments)];
		this.args = [null, val];
		this.pos < this.len && nextTick(function fire() { that.$$fire(); });
	}; // resolve

	// PromiseLight#$$reject
	PromiseLight.prototype.$$reject = function $$reject(err, val) {
		var that = this;
		//if (this.args) return this.args[0] ?
		//	err ? console.log('rejected twice:', err, this.args[0]) :
		//	      console.log('resolved after rejected:', val, this.args[0]) :
		//	err ? console.log('rejected after resolved:', err, this.args[1]) :
		//	      console.log('resolved twice:', val, this.args[1]);
		this.args = arguments;
		this.pos < this.len && nextTick(function fire() { that.$$fire(); });
	}; // reject

	// PromiseLight#$$fire
	PromiseLight.prototype.$$fire = function $$fire() {
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
	}; // fire

	// PromiseLight#toString
	PromiseLight.prototype.toString = function () {
		return 'PromLit { ' + JSON.stringify(this.args) + ' }';
	};

	// PromiseLight.defer
	PromiseLight.defer = function () {
		var resolve, reject;
		var p = new PromiseLight(function (res, rej) { resolve = res; reject = rej; });
		return {promise: p, resolve: resolve, reject: reject};
	};

	function isPromise(p) {
		return p instanceof PromiseLight || p instanceof Promise || (!!p && p.then);
	}

	PromiseLight.all = function all(promises) {
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
	}; // all

	PromiseLight.resolve = function resolve(val) {
		return new PromiseLightSolved(null, val);
		//return new PromiseLight(function (res, rej) { res(val); });
	};
	PromiseLight.reject = function reject(err) {
		return new PromiseLightSolved(err);
		//return new PromiseLight(function (res, rej) { rej(err); });
	};

	function PromiseLightSolved() {//err, val) {
		this.pos = this.len = 0;
		this.args = arguments;
		return;
	} // PromiseLightSolved
	PromiseLightSolved.prototype = PromiseLight.prototype;

	function PromiseLightNext(cb) {
		this.pos = this.len = 0;
		this.args = null;
		cb.next_cb = reject;
		var that = this;
		return;

		function reject(err, val)  { return that.$$reject(err, val); }
	} // PromiseLightNext
	PromiseLightNext.prototype = PromiseLight.prototype;

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
