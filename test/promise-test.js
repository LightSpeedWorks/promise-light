// promise-test.js

function errmsg(err) {
	var msg = err.stack || err + '';
	return msg.split('\n').filter(function (s) { return !s.match(/mocha/); }).join('\n');
}

function p2str(p) {
	var s = p + '';
	return s.substr(0, 8) === '[object ' ? p : s;
}

if (typeof process !== 'undefined') {
	process.on('unhandledRejection', function (err, p) {
		console.error('\x1b[33m* UnhandledRejection:\x1b[36m', p2str(p), '\x1b[35m\n*', errmsg(err), '\x1b[m');
	});
	process.on('rejectionHandled', function (p) {
		console.error('\x1b[32m* RejectionHandled:\x1b[36m  ', p2str(p), '\x1b[m');
	});
}

void function (assert, describe, it,
		PromiseCore, PromiseLight, PromiseLightA, PromiseLightB,
		PromiseLight4, PromiseLight6, PromiseLight8) {
	'use strict';

	try {
		var PromiseThunk = require('../../promise-thunk/promise-thunk');
	} catch (e) {
		var PromiseThunk = require('promise-thunk');
	}

	var promises = {
		Promise: /* native*/ typeof Promise === 'function' ? Promise : undefined,
		bluebird: typeof bluebird === 'function' ? bluebird : require('bluebird'),
		'es6-promise': require('es6-promise') && require('es6-promise').Promise,
		'promise-light4': PromiseLight4,
		'promise-light6': PromiseLight6,
		'promise-light8': PromiseLight8,
		'promise-light': PromiseLight,
		'promise-core': PromiseCore,
		'promise-light-b': PromiseLightB,
		'promise-light-a': PromiseLightA,
		'promise-thunk': PromiseThunk
	};

	//console.log(promises);

	// Object.keys for ie8
	if (!Object.keys)
		Object.keys = function keys(obj) {
			var keys = [];
			for (var i in obj)
				if (obj.hasOwnProperty(i)) keys.push(i);
			return keys;
		};

	// Object.getOwnPropertyNames for ie8
	if (!Object.getOwnPropertyNames)
		Object.getOwnPropertyNames = Object.keys;

	// Array.prototype.forEach for ie8
	if (!Array.prototype.forEach)
		Array.prototype.forEach = function forEach(fn) {
			for (var i = 0, n = this.length; i < n; ++i)
				fn(this[i], i, this);
		};

	// Array.prototype.map for ie8
	if (!Array.prototype.map)
		Array.prototype.map = function map(fn) {
			var arr = [];
			for (var i = 0, n = this.length; i < n; ++i)
				arr.push(fn(this[i], i, this));
			return arr;
		};

	// Array.prototype.filter for ie8
	if (!Array.prototype.filter)
		Array.prototype.filter = function filter(fn) {
			var arr = [];
			for (var i = 0, n = this.length; i < n; ++i)
				if (fn(this[i], i, this))
					arr.push(this[i]);
			return arr;
		};

	var keys = Object.keys(promises);
	keys.forEach(function (key) {
		var Promise = promises[key];
		if (!Promise) return;

		// test テスト
		var no = 0;

		// msミリ秒後にこのpromiseを解決する
		function delay(ms, val) {
			return new Promise(function (resolve, reject) {
				setTimeout(function () { resolve(val); }, ms);
			});
		} // delay

		// msミリ秒後にこのpromiseを拒否する
		function delayReject(ms, val) {
			return new Promise(function (resolve, reject) {
				setTimeout(function () { reject(new Error('err ' + val)); }, ms);
			});
		} // delayReject

		// timer3
		// msミリ秒後にこのpromiseを解決または拒否する
		function timer3(ms) {
			return Math.random() > 0.5 ? timer(ms) : timer2(ms);
		}

		describe('test promise "' + key + '"', function () {

			if (typeof Promise === 'undefined')
				return it('Promise not implemented');

			it('Promise setup sequence', function () {
				var seq = 0;
				assert.equal(++seq, 1);
				// Promise setup called synchronously
				// Promise setup は同期的に呼ばれる
				var p = new Promise(function (resolve, reject) {
					assert.equal(++seq, 2);
					resolve(123);
					assert.equal(++seq, 3);
				});
				assert.equal(++seq, 4);
				p.then(
					function (val) {
						assert.equal(val, 123);
						assert.equal(++seq, 6); },
					function (err) {
						assert(false, 'ng: ' + err); });
				assert.equal(++seq, 5);
				return p;
			}); // it Promise setup sequence

			it('Promise setup unhandled resolve', function () {
				return new Promise(function (resolve, reject) {
					var p = new Promise(function (res, rej) {
						res(123);
						resolve('ok');
					});
					setTimeout(function () {
						p.then(function () {
							//console.log('Promise setup unhandled resolve: ok');
						},
						function () {
							console.log('\x1b[1;31mPromise setup unhandled resolve: ng\x1b[m');
						});
					}, 1);
				});
			}); // it Promise setup unhandled resolve

			it('Promise setup unhandled reject', function () {
				return new Promise(function (resolve, reject) {
					var p = new Promise(function (res, rej) {
						rej(new Error('ng: unhandled reject'));
						resolve('ok');
					});
					setTimeout(function () {
						p.then(function () {
							console.log('\x1b[1;31mPromise setup unhandled reject: ngx1b[m');
						},
						function () {
							//console.log('\x1b[1;31mPromise setup unhandled reject: ok\x1b[m');
						});
					}, 1);
				});
			}); // it Promise setup unhandled reject

			it('Promise setup resolve then twice', function () {
				var p = new Promise(function (resolve, reject) {
					resolve(123);
				});
				var results = [];
				p.then(
					function (val) {
						results.push(val); },
					function (err) {
						results.push(err); });
				p.then(
					function (val) {
						results.push(val); },
					function (err) {
						results.push(err); });
				return p.then(function () {
					assert.deepEqual(results, [123, 123]);
				});
			}); // it Promise setup resolve then twice

			it('Promise setup resolve twice', function () {
				return new Promise(function (resolve, reject) {
					resolve(123);
					resolve(456);
				}).then(
					function (val) {
						assert.equal(val, 123); },
					function (err) {
						assert(false, 'ng: ' + err); });
			}); // it Promise setup resolve twice

			it('Promise setup resolve and reject', function () {
				return new Promise(function (resolve, reject) {
					resolve(123);
					reject(new Error('ng'));
				}).then(
					function (val) {
						assert.equal(val, 123); },
					function (err) {
						assert(false, 'ng: ' + err); });
			}); // it Promise setup resolve and reject

			it('Promise setup reject and resolve', function () {
				return new Promise(function (resolve, reject) {
					reject(new Error('ng'));
					resolve(123);
				}).then(
					function (val) {
						assert(false, 'ng: ' + val); },
					function (err) {
						assert.equal(err.message, 'ng'); });
			}); // it Promise setup reject and resolve

			it('Promise setup reject twice', function () {
				return new Promise(function (resolve, reject) {
					reject(new Error('ng'));
					reject(new Error('ng2'));
				}).then(
					function (val) {
						assert(false, 'ng: ' + err); },
					function (err) {
						assert.equal(err.message, 'ng'); });
			}); // it Promise setup resolve twice

			it('Promise setup error', function () {
				return new Promise(function (resolve, reject) {
					throw new Error('ng');
				}).then(
					function (val) { assert(false, 'ng: ' + val); },
					function (err) { assert.equal(err.message, 'ng'); });
			}); // it Promise setup error

			it('Promise setup unhandled error', function () {
				var pass = 'none';
				new Promise(function (resolve, reject) {
					throw new Error('ng');
				}).then(function (val) { pass = 'ng: ' + val; })
				['catch'](function (err) {
					if (err.message === 'ng') pass = 'ok';
					else pass = 'ng: ' + err.stack; });
				return delay(10, 'ok').then(
					function (val) {
						assert(pass === 'ok', pass); });
			}); // it Promise setup unhandled error

			it('Promise setup resolve delayed then once', function () {
				var p = new Promise(function (resolve, reject) {
					resolve(123);
				});
				var called;
				delay(10, 'ok').then(
					function (val) {
						p.then(
							function (val) {
								called = true;
								assert.equal(val, 123); },
							function (err) {
								assert(false, 'ng: ' + err); }); },
						function (err) {
							assert(false, 'ng: ' + err); });
				return delay(100, 'ok').then(
					function (val) {
						assert(called, 'called?'); });
			}); // it Promise setup resolve delayed then once

			it('Promise setup resolve delayed then twice', function () {
				var p = new Promise(function (resolve, reject) {
					resolve(456);
				});
				p.then(
					function (val) {
						assert.equal(val, 456); },
					function (err) {
						assert(false, 'ng: ' + err); });
				var called;
				delay(10, 'ok').then(
					function (val) {
						assert.equal(val, 'ok');
						p.then(
							function (val) {
								called = true;
								assert.equal(val, 456); },
							function (err) {
								assert(false, 'ng: ' + err); }); },
						function (err) {
							assert(false, 'ng: ' + err); });
				return delay(100, 'ok').then(
					function (val) {
						assert(called, 'called?'); });
			}); // it Promise setup resolve delayed then twice

			it('Promise.resolve number', function () {
				return Promise.resolve(123).then(
					function (val) {
						assert.equal(val, 123); },
					function (err) {
						assert(false, 'ng: ' + err); });
			}); // it Promise.resolve number

			it('Promise.resolve string', function () {
				return Promise.resolve('ok').then(
					function (val) {
						assert.equal(val, 'ok'); },
					function (err) {
						assert(false, 'ng: ' + err); });
			}); // it Promise.resolve string

			it('Promise.resolve boolean', function () {
				return Promise.resolve(true).then(
					function (val) {
						assert.equal(val, true); },
					function (err) {
						assert(false, 'ng: ' + err); });
			}); // it Promise.resolve boolean

			it('Promise.resolve promise', function () {
				return Promise.resolve(delay(10, 'ok')).then(
					function (val) {
						assert.equal(val, 'ok'); },
					function (err) {
						assert(false, 'ng: ' + err); });
			}); // it Promise.resolve promise

			Promise.accept &&
			it('Promise.accept promise', function () {
				return Promise.accept(delay(10, 'ok')).then(
					function (val) {
						assert.equal(val, 'ok'); },
					function (err) {
						assert(false, 'ng: ' + err); });
			}) // it Promise.accept promise
			|| it('Promise.accept not implemented');

			it('Promise.reject error', function () {
				return Promise.reject(new Error('ng')).then(
					function (val) {
						assert(false, 'ng: ' + val); },
					function (err) {
						assert.equal(err.message, 'ng'); });
			}); // it Promise.reject error

			it('Promise.reject non-error', function () {
				return Promise.reject('ng').then(
					function (val) {
						assert(false, 'ng: ' + val); },
					function (err) {
						assert.equal(err, 'ng'); });
			}); // it Promise.reject non-error

			it('Promise.all promises', function () {
				return Promise.all([delay(10, 10), delay(20, 20), delay(30, 30)])
					.then(
						function (val) {
							assert.deepEqual(val, [10, 20, 30]); },
						function (err) {
							assert(false, 'ng: ' + err); });
			}); // it Promise.all promises

			key !== 'light-promise' &&
			it('Promise.all []', function () {
				return Promise.all([])
					.then(
						function (val) {
							assert.deepEqual(val, []); },
						function (err) {
							assert(false, 'ng: ' + err); });
			}) // it Promise.all []
			|| it('Promise.all([]) not implemented');

			it('Promise.all resolves', function () {
				return Promise.all([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)])
					.then(
						function (val) {
							assert.deepEqual(val, [1, 2, 3]); },
						function (err) {
							assert(false, 'ng: ' + err); });
			}); // it Promise.all resolves

			key !== 'light-promise' &&
			it('Promise.all values', function () {
				return Promise.all([1, 2, 3])
					.then(
						function (val) {
							assert.deepEqual(val, [1, 2, 3]); },
						function (err) {
							assert(false, 'ng: ' + err); });
			}) // it Promise.all values
			|| it('Promise.all values not implemented');

			Promise.race &&
			it('Promise.race promises', function () {
				return Promise.race([delay(10, 10), delay(20, 20), delay(15, 30)])
					.then(
						function (val) {
							assert.equal(val, 10); },
						function (err) {
							assert(false, 'ng: ' + err); });
			}) // it Promise.race promises
			|| it('Promise.race not implemented');

			Promise.race &&
			it('Promise.race resolves', function () {
				return Promise.race([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)])
					.then(
						function (val) {
							assert.equal(val, 1); },
						function (err) {
							assert(false, 'ng: ' + err); });
			}); // it Promise.race resolves

			Promise.race &&
			it('Promise.race values', function () {
				return Promise.race([1, 2, 3]).then(
					function (val) {
						assert.equal(val, 1); },
					function (err) {
						assert(false, 'ng: ' + err); });
			}); // it Promise.race values

			Promise.race &&
			it('Promise.race []', function () {
				return Promise.race([
					Promise.race([]).then(
						function (val) {
							assert(false, 'ng: ' + val); },
						function (err) {
							assert(false, 'ng: ' + err); }),
					delay(20, 123)]).then(
						function (val) {
							assert.equal(val, 123); },
						function (err) {
							assert(false, 'ng: ' + err); });
			}); // it Promise.race []

			it('promise sequence', function () {
				var seq = 0;
				assert.equal(++seq, 1);
				Promise.resolve(1).then(
					function (val) { assert.equal(val, 1); assert.equal(++seq, 4); },
					function (err) { assert(false, 'ng: ' + err); ++seq; });
				assert.equal(++seq, 2);
				Promise.reject('ng').then(
					function (val) { assert.equal(val, 1); ++seq; },
					function (err) { assert.equal(err, 'ng');  assert.equal(++seq, 5); });
				assert.equal(++seq, 3);
				return Promise.all([Promise.resolve(1)])
					.then(
						function (val) { assert.equal(++seq, 6); },
						function (err) { assert(false, 'ng: ' + err); ++seq; });
			}); // it promise sequence

			Promise.defer &&
			it('Promise.defer', function () {
				var dfd = Promise.defer();
				setTimeout(function () { dfd.resolve('ok'); }, 10);
				return dfd.promise.then(
					function (val) {
						assert.equal(val, 'ok', 'Promise defer not ok'); },
					function (err) {
						assert(false, 'ng: ' + err); });
			}) // it Promise.defer
			|| it('Promise.defer not implemented');

			Promise.defer &&
			it('Promise.defer promise constructor is Promise', function () {
				var dfd = Promise.defer();
				dfd.resolve();
				assert.equal(dfd.promise.constructor, Promise);
			}); // it Promise.defer

			Promise.defer &&
			function () {
				var dfd = Promise.defer();
				dfd.resolve();
				return dfd.constructor === Object;
			} () &&
			it('Promise.defer constructor is Object', function () {
				var dfd = Promise.defer();
				dfd.resolve();
				assert.equal(dfd.constructor, Object);
			}) // it Promise.defer constructor is Object
			|| it('Promise.defer constructor is not Object');

			Promise.defer &&
			function () {
				var dfd = Promise.defer();
				var res = dfd.resolve;
				try { res(); return true; }
				catch (e) { return false; }
			} () &&
			it('Promise.defer without context', function () {
				var dfd = Promise.defer();
				setTimeout(function () {
						var res = dfd.resolve;
						try { res('ok'); }
						catch (e) {
							dfd.reject(e);
						}
					}, 10);
				return dfd.promise.then(
					function (val) {
						assert.equal(val, 'ok'); },
					function (err) {
						assert(false, 'ng: ' + err); });
			}) // it Promise.defer without context
			|| it('Promise.defer without conext not implemented');

			key !== 'bluebird' &&
			it('Promise keys match', function () {
				var keys = Object.keys(Promise).sort().join(',');
				assert(keys === 'all,race,reject,resolve' ||
							 keys === 'accept,all,defer,race,reject,resolve' ||
							 keys === '_asap,_setAsap,_setScheduler,all,race,reject,resolve' || // es6-promise
							 keys === '', 'Promise keys not match: keys = ' + keys);
			}) // it Promise keys
			|| it('Promise keys not match');

			key !== 'bluebird' &&
			it('Promise own property names match', function () {
				function f(x) {
					return x !== 'arguments'  && x !== 'caller' &&
								 x !== 'length'     && x !== 'name'   &&
								 x !== 'prototype'  && x !== 'toString';
				}
				var keys = Object.getOwnPropertyNames(Promise).filter(f).sort().join(',');


				assert(keys === 'accept,all,defer,race,reject,resolve' ||
					keys === 'Promise,PromiseThunk,accept,all,convert,defer,isIterable,isIterator,isPromise,makeArrayFromIterator,promisify,promisifyAll,race,reject,resolve,thunkify,thunkifyAll,wrap' ||
					keys === 'Promise,PromiseLight,accept,all,convert,defer,isIterable,isIterator,isPromise,makeArrayFromIterator,promisify,promisifyAll,race,reject,resolve,thunkify,thunkifyAll,wrap' ||
					keys === 'Promise,PromiseLight,accept,all,convert,defer,isIterable,isIterator,isPromise,makeArrayFromIterator,race,reject,resolve,wrap' ||
					keys === 'accept,all,defer,isIterable,isIterator,isPromise,makeArrayFromIterator,race,reject,resolve' ||
					keys === '_asap,_setAsap,_setScheduler,all,race,reject,resolve' || // es6-promise
					keys === 'all,race,reject,resolve',
					'Promise own property names match: keys = ' + keys);
			}) // it Promise own property names
			|| it('Promise own property names not match');

			typeof Symbol === 'function' && Symbol && Symbol.iterator &&
			it('ES6 iterator', function () {
				var a = {}, b = {};
				a[Symbol.iterator] = iterator;
				b[Symbol.iterator] = iterator;
				Promise.all(a).then(
					function (values) { assert.deepEqual(values, [20, 40, 60]); },
					function (error) { assert(false, 'Error: ' + error); });
				Promise.race(b).then(
					function (values) { assert.deepEqual(values, 20); },
					function (error) { assert(false, 'Error: ' + error); });

				function iterator() {
					var i = 0;
					var iter = {
						next: function () {
							i += 20;
							return i <= 60 ? {value: i} : {done: true};
						}
					};
					return iter;
				}
			}); // it ES6 iterator

			key !== 'bluebird' &&
			it('iterator values', function () {
				Promise.all(iterator()).then(
					function (values) { assert.deepEqual(values, [20, 40, 60]); },
					function (error) { assert(false, 'Error: ' + error); });
				Promise.race(iterator()).then(
					function (values) { assert.deepEqual(values, 20); },
					function (error) { assert(false, 'Error: ' + error); });

				function iterator() {
					var i = 0;
					var iter = {
						next: function () {
							i += 20;
							return i <= 60 ? {value: i} : {done: true};
						}
					};
					if (typeof Symbol === 'function' && Symbol && Symbol.iterator)
						iter[Symbol.iterator] = iterator;
					return iter;
				}
			}) || // it iterator
			it('iterator values');

			key !== 'bluebird' &&
			it('iterator promises', function () {
				Promise.all(iterator()).then(
					function (values) { assert.deepEqual(values, [20, 40, 60]); },
					function (error) { assert(false, 'Error: ' + error); });
				Promise.race(iterator()).then(
					function (values) { assert.deepEqual(values, 20); },
					function (error) { assert(false, 'Error: ' + error); });

				function iterator() {
					var i = 0;
					var iter = {
						next: function () {
							i += 20;
							return i <= 60 ? {value: delay(i, i)} : {done: true};
						}
					};
					if (typeof Symbol === 'function' && Symbol && Symbol.iterator)
						iter[Symbol.iterator] = iterator;
					return iter;
				}
			}) || // it iterator
			it('iterator promises not supported');

			function nodeStyle(err, val) {
				var cb = arguments[--arguments.length];
				if (typeof cb !== 'function')
					throw new TypeError('cb must be a function');
				if (arguments.length < 2) val = undefined;
				setTimeout(cb, 5, err, val); }

			function existsStyle(val, cb) {
				if (typeof cb !== 'function')
					throw new TypeError('cb must be a function');
				setTimeout(cb, 5, val);
			}

			function execStyle(err, val1, val2, cb) {
				if (typeof cb !== 'function')
					throw new TypeError('cb must be a function');
				setTimeout(cb, 5, err, val1, val2);
			}

			Promise.thunkify &&
			it('thunkify 1 val', function (done) {
				var nodeStyleThunk = Promise.thunkify(nodeStyle);
				nodeStyleThunk(null, 123)(function (err, val) {
					try {
						assert(err == null, 'err != null');
						assert.equal(val, 123);
						done();
					} catch(e) { done(e); }
				});
			}); // thunkify 1

			Promise.thunkify &&
			it('thunkify 2 err', function (done) {
				var nodeStyleThunk = Promise.thunkify(nodeStyle);
				nodeStyleThunk(new Error('ng'))(function (err, val) {
					try {
						assert(val == null, 'val != null');
						assert.equal(err.message, 'ng');
						done();
					} catch(e) { done(e); }
				});
			}); // thunkify 2

			Promise.thunkify &&
			it('thunkify 3 fs.extsts true', function (done) {
				var existsStyleThunk = Promise.thunkify(existsStyle);
				existsStyleThunk(true)(function (val) {
					try {
						assert.equal(val, true);
						done();
					} catch(e) { done(e); }
				});
			}); // thunkify 3

			Promise.thunkify &&
			it('thunkify 4 fs.extsts false', function (done) {
				var existsStyleThunk = Promise.thunkify(existsStyle);
				existsStyleThunk(false)(function (val) {
					try {
						assert.equal(val, false);
						done();
					} catch(e) { done(e); }
				});
			}); // thunkify 4

			Promise.thunkify &&
			it('thunkify 5 fs.extsts err, val', function (done) {
				var existsStyleThunk = Promise.thunkify(existsStyle);
				existsStyleThunk(true)(function (err, val) {
					try {
						assert(err == null, 'err != null');
						assert.equal(val, true);
						done();
					} catch(e) { done(e); }
				});
			}); // thunkify 5

			Promise.thunkify &&
			it('thunkify 6 childProcess.exec err, val1, val2', function (done) {
				var execStyleThunk = Promise.thunkify(execStyle);
				execStyleThunk(null, 'val1', 'val2')(function (err, val1, val2) {
					try {
						assert(err == null, 'err != null');
						assert.equal(val1, 'val1');
						assert.equal(val2, 'val2');
						done();
					} catch(e) { done(e); }
				});
			}); // thunkify 6

			Promise.promisify &&
			it('promisify 1 val', function (done) {
				var nodeStylePromise = Promise.promisify(nodeStyle);
				var p = nodeStylePromise(null, 123);
				var n = 0;
				if (typeof p === 'function')
				++n, p(function (err, val) {
					try {
						assert(err == null, 'err != null');
						assert.equal(val, 123);
						end();
					} catch(e) { done(e); }
				});
				++n, p.then(
					function (val) {
						try {
							assert.equal(val, 123);
							end();
						} catch(e) { done(e); }
					},
					done);
				function end() { --n || done(); }
			}); // promisify 1

			Promise.promisify &&
			it('promisify 2 err', function (done) {
				var nodeStylePromise = Promise.promisify(nodeStyle);
				var p = nodeStylePromise(new Error('ng'));
				var n = 0;
				if (typeof p === 'function')
				++n, p(function (err, val) {
					try {
						assert(val == null, 'val != null');
						assert.equal(err.message, 'ng');
						end();
					} catch(e) { done(e); }
				});
				++n, p.then(
					function (val) { done(new Error('ng')); },
					function (err) {
						try {
							assert.equal(err.message, 'ng');
							end();
						} catch(e) { done(e); }
					});
				function end() { --n || done(); }
			}); // promisify 2

			function existsStyle(val, cb) {
				if (typeof cb !== 'function')
					throw new TypeError('cb must be a function');
				setTimeout(cb, 5, val);
			}

			key !== 'bluebird' &&
			Promise.promisify &&
			it('promisify 3 fs.extsts true', function (done) {
				var existsStylePromise = Promise.promisify(existsStyle);
				var p = existsStylePromise(true);
				var n = 0;
				if (typeof p === 'function')
				++n, p(function (val) {
					try {
						assert.equal(val, true);
						end();
					} catch(e) { done(e); }
				});
				++n, p.then(
					function (val) {
						try {
							assert.equal(val, true);
							end();
						} catch(e) { done(e); }
					},
					done);
				function end() { --n || done(); }
			}); // promisify 3

			key !== 'bluebird' &&
			Promise.promisify &&
			it('promisify 4 fs.extsts false', function (done) {
				var existsStylePromise = Promise.promisify(existsStyle);
				var p = existsStylePromise(false);
				var n = 0;
				if (typeof p === 'function')
				++n, p(function (val) {
					try {
						assert.equal(val, false);
						end();
					} catch(e) { done(e); }
				});
				++n, p.then(
					function (val) {
						try {
							assert.equal(val, false);
							end();
						} catch(e) { done(e); }
					},
					done);
				function end() { --n || done(); }
			}); // promisify 4

			key !== 'bluebird' &&
			Promise.promisify &&
			it('promisify 5 fs.extsts err, val', function (done) {
				var existsStylePromise = Promise.promisify(existsStyle);
				var p = existsStylePromise(true);
				var n = 0;
				if (typeof p === 'function')
				++n, p(function (err, val) {
					try {
						assert(err == null, 'err != null');
						assert.equal(val, true);
						end();
					} catch(e) { done(e); }
				});
				++n, p.then(
					function (val) {
						try {
							assert.equal(val, true);
							end();
						} catch(e) { done(e); }
					},
					done);
				function end() { --n || done(); }
			}); // promisify 5

			key !== 'bluebird' &&
			Promise.promisify &&
			it('promisify 6 childProcess.exec err, val1, val2', function (done) {
				var execStylePromise = Promise.promisify(execStyle);
				var p = execStylePromise(null, 'val1', 'val2');
				var n = 0;
				if (typeof p === 'function')
				++n, p(function (err, val1, val2) {
					try {
						assert(err == null, 'err != null');
						assert.equal(val1, 'val1');
						assert.equal(val2, 'val2');
						end();
					} catch(e) { done(e); }
				});
				++n, p.then(
					function (val) {
						try {
							assert.deepEqual(val, ['val1', 'val2']);
							end();
						} catch(e) { done(e); }
					},
					done);
				function end() { --n || done(); }
			}); // promisify 6

			key !== 'bluebird' &&
			Promise.promisify &&
			it('promisify 7 childProcess.exec err, val1, val2', function (done) {
				var execStylePromise = Promise.promisify(execStyle);
				var p = execStylePromise(null, 'val1', 'val2');
				var n = 0;
				if (typeof p === 'function')
				++n, p(function (err, val) {
					try {
						assert(err == null, 'err != null');
						assert.deepEqual(val, ['val1', 'val2']);
						end();
					} catch(e) { done(e); }
				});
				++n, p.then(
					function (val) {
						try {
							assert.deepEqual(val, ['val1', 'val2']);
							end();
						} catch(e) { done(e); }
					},
					done);
				function end() { --n || done(); }
			}); // promisify 7

			if (typeof Promise.resolve(1) !== 'function')
				return;

			// PromiseThunk test begins

			it('PromiseThunk sequence', function () {
				var seq = 0;
				assert.equal(++seq, 1);
				var p = new Promise(function (resolve, reject) {
					assert.equal(++seq, 2);
					resolve(123);
					assert.equal(++seq, 3);
				});
				assert.equal(++seq, 4);
				p(function (err, val) {
					assert.equal(val, 123);
					assert(err == null);
					assert.equal(++seq, 6); });
				assert.equal(++seq, 5);
				return p;
			}); // it PromiseThunk sequence

			it('PromiseThunk chain', function (done) {
				var seq = 0;
				Promise.resolve(123)
				(function (err, val) {
					if (err) return done(err);
					try {
						++seq;
						assert.equal(val, 123);
						assert(err == null);
						assert.equal(seq, 1);
					} catch (e) { done(e); }
					return 456;
				})
				(function (err, val) {
					if (err) return done(err);
					try {
						++seq;
						assert.equal(val, 456);
						assert(err == null);
						assert.equal(seq, 2);
					} catch (e) { done(e); }
					return Promise.resolve(789);
				})
				(function (err, val) {
					if (err) return done(err);
					try {
						++seq;
						assert.equal(val, 789);
						assert(err == null);
						assert.equal(seq, 3);
						done();
					} catch (e) { done(e); }
				});
				return;
			}); // it PromiseThunk chain

			// PromiseThunk test ends

		}); // describe


	}); // keys forEach

}(
		typeof assert   === 'function' ? assert   : require('../lib/assert'),
		typeof describe === 'function' ? describe : require('../lib/describe-it'),
		typeof it       === 'function' ? it       : require('../lib/describe-it').it,
		typeof PromiseCore   === 'function' ? PromiseCore   : require('../work/promise-core'),
		typeof PromiseLight  === 'function' ? PromiseLight  : require('../promise-light'),
		typeof PromiseLightA === 'function' ? PromiseLightA : require('../work/promise-light-a'),
		typeof PromiseLightB === 'function' ? PromiseLightB : require('../work/promise-light-b'),
		typeof PromiseLight4 === 'function' ? PromiseLight4 : require('../work/promise-light4'),
		typeof PromiseLight6 === 'function' ? PromiseLight6 : require('../work/promise-light6'),
		typeof PromiseLight8 === 'function' ? PromiseLight8 : require('../work/promise-light8')
		);
