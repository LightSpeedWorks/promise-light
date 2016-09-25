// PromiseLight

void function (global, PromiseOrg) {
	'use strict';

	var slice = [].slice;

	var hasConsole = typeof console === 'object' && console !== null;
	var hasConsoleWarn  = hasConsole && typeof console.warn  === 'function';
	var hasConsoleError = hasConsole && typeof console.error === 'function';

	var COLOR_ERROR  = typeof window !== 'undefined' ? '' : '\x1b[35m';
	var COLOR_NORMAL = typeof window !== 'undefined' ? '' : '\x1b[m';

	// Object.keys for ie8
	if (!Object.keys)
		Object.keys = function keys(obj) {
			var props = [];
			for (var prop in obj)
				if (obj.hasOwnProperty(prop))
					props.push(prop);
			return props;
		},
		hasConsoleWarn && console.warn('Undefined: Object.keys');

	// Object.getOwnPropertyNames for ie8
	if (!Object.getOwnPropertyNames)
		Object.getOwnPropertyNames = Object.keys,
		hasConsoleWarn && console.warn('Undefined: Object.getOwnPropertyNames');

	// Array.prototype.reduce for ie8
	if (!Array.prototype.reduce)
		Array.prototype.reduce = function reduce(fn, val) {
			var i = 0;
			if (arguments.length <= 1) val = this[i++];
			for (var n = this.length; i < n; ++i)
				val = fn(val, this[i], i, this);
			return val;
		},
		hasConsoleWarn && console.warn('Undefined: Array.prototype.reduce');

	var COLORS = {red: '31', green: '32', purple: '35', cyan: '36', yellow: '33'};
	var colors = Object.keys(COLORS).reduce(function (obj, k) {
		obj[k] = typeof window === 'object' ? function (x) { return x; } :
			function (x) { return '\x1b[' + COLORS[k] + 'm' + x + '\x1b[m'; };
		return obj;
	}, {});

	function errmsg(err) { return err.stack || err; }

	// defProp(obj, prop, propDesc)
	var defProp = function (obj) {
		if (!Object.defineProperty) return null;
		try {
			Object.defineProperty(obj, 'prop', {value: 'str'});
			return obj.prop === 'str' ? Object.defineProperty : null;
		} catch (err) { return null; }
	} ({});

	// setConst(obj, prop, val)
	var setConst = defProp ?
		function setConst(obj, prop, val) {
			defProp(obj, prop, {value: val}); } :
		function setConst(obj, prop, val) { obj[prop] = val; };

	// setValue(obj, prop, val)
	var setValue = defProp ?
		function setValue(obj, prop, val) {
			defProp(obj, prop, {value: val,
				writable: true, configurable: true}); } :
		function setValue(obj, prop, val) { obj[prop] = val; };

	// getProto(obj)
	var getProto = Object.getPrototypeOf ||
		function getProto(obj) { return obj.__proto__; };

	// setProto(obj, proto)
	var setProto = Object.setPrototypeOf ||
		function (obj, proto) { obj.__proto__ = proto; };

	// BaseClass.extend(proto, statics)
	function extend(proto, statics) {
		var ctor = proto.constructor;
		function super_() { setValue(this, 'constructor', ctor); }
		if (typeof this === 'function')
			super_.prototype = this.prototype,
			ctor.prototype = new super_();
		for (var p in proto)
			if (proto.hasOwnProperty(p) &&
				!ctor.prototype.hasOwnProperty(p))
				setValue(ctor.prototype, p, proto[p]);
		for (var p in statics)
			if (statics.hasOwnProperty(p))
				setValue(ctor, p, statics[p]);
		return ctor;
	}

	// nextTickDo(fn)
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
	var PROMISE_FLAG_UNHANDLED = PROMISE_FLAG_HANDLED | PROMISE_FLAG_UNHANDLED_REJECTION;


	// new Promise(function setup(resolve, reject) {})
	var Promise = extend({
		constructor: function Promise(setup) {
			if (!(this instanceof Promise))
				throw new TypeError('new Promise!!!');

			var thunk = this;
			thunk.flag = 0;
			thunk.result = undefined;
			thunk.tail = thunk.head = undefined;

			try { setup(resolve, reject); }
			catch (err) { reject(err); }

			return thunk;

			function resolve(val) { return $$resolve(thunk, val); }
			function reject(err)  { return $$reject(thunk, err); }
		}, // Promise

		then: then,
		'catch': caught,
		toString: toString,
		toJSON: toJSON
	},

	{ // statics
		all: all,
		race: race,
		defer: defer,
		resolve: resolve,
		reject: reject,
		accept: resolve,
		convert: resolve,
		wrap: promisify,
		promisify: promisify,
		thunkify: thunkify,
		promisifyAll: promisifyAll,
		thunkifyAll: thunkifyAll,
		isIterable: isIterable,
		isIterator: isIterator,
		isPromise: isPromise,
		makeArrayFromIterator: makeArrayFromIterator
	}); // Promise

	// new PromiseResolved(val)
	function PromiseResolved(val) {
		var thunk = this;
		thunk.flag = PROMISE_FLAG_RESOLVED;
		thunk.result = val;
		thunk.tail = thunk.head = undefined;
		return thunk;
	} // PromiseResolved
	PromiseResolved.prototype = Promise.prototype;

	// new PromiseRejected(err)
	function PromiseRejected(err) {
		var thunk = this;
		thunk.flag = PROMISE_FLAG_REJECTED;
		thunk.result = err;
		thunk.tail = thunk.head = undefined;
		nextExec(thunk, $$fire);
		return thunk;
	} // PromiseRejected
	PromiseRejected.prototype = Promise.prototype;

	// new PromiseNext(parent, reject, resolve)
	function PromiseNext(parent, reject, resolve) {
		var thunk = this;
		thunk.flag = 0;
		thunk.result = undefined;
		thunk.tail = thunk.head = undefined;

		var bomb = {rej:reject, res:resolve, thunk:thunk, chain:undefined};
		parent.tail = parent.tail ? (parent.tail.chain = bomb) : (parent.head = bomb);
		if (parent.flag & PROMISE_FLAG_SOLVED) nextExec(parent, $$fire);

		return thunk;
	} // PromiseNext
	PromiseNext.prototype = Promise.prototype;

	// new PromiseDefer()
	function PromiseDefer() {
		var thunk = this;
		thunk.flag = 0;
		thunk.result = undefined;
		thunk.tail = thunk.head = undefined;
		return {promise:thunk, resolve:resolve, reject:reject};

		function resolve(val) { return $$resolve(thunk, val); }
		function reject(err)  { return $$reject(thunk, err); }
	} // PromiseDefer
	PromiseDefer.prototype = Promise.prototype;

	// new PromiseConvert(thenable)
	function PromiseConvert(thenable) {
		var thunk = this;
		thunk.flag = 0;
		thunk.result = undefined;
		thunk.tail = thunk.head = undefined;

		thenable.then(resolve, reject);

		return thunk;

		function resolve(val) { return $$resolve(thunk, val); }
		function reject(err)  { return $$reject(thunk, err); }
	} // PromiseConvert
	PromiseConvert.prototype = Promise.prototype;

	// Promise.resolve(val)
	function resolve(val) {
		if (isPromise(val)) return new PromiseConvert(val);
		return new PromiseResolved(val);
	}

	// Promise.reject(err)
	function reject(err) {
		return new PromiseRejected(err);
	}

	// Promise.defer()
	function defer() {
		return new PromiseDefer();
	}

	// Promise#toString()
	function toString() {
		return colors.cyan('PromiseLight { ') + (
			this.flag & PROMISE_FLAG_RESOLVED ? colors.green(this.result) :
			this.flag & PROMISE_FLAG_REJECTED ? colors.red('<rejected> [' + this.result + ']') :
			colors.yellow('<pending>')) + colors.cyan(' }');
	}

	// Promise#toJSON()
	function toJSON() {
		var obj = {'class': 'PromiseLight'};
		obj.state = ['pending', 'resolved', 'rejected'][this.flag & PROMISE_FLAG_SOLVED];
		if (this.flag & PROMISE_FLAG_RESOLVED) obj.value = this.result;
		if (this.flag & PROMISE_FLAG_REJECTED) obj.error = this.result;
		return obj;
	}

	// Promise#then(resolve, reject)
	function then(resolve, reject) {
		return new PromiseNext(this, reject, resolve);
	}

	// Promise#catch(reject)
	function caught(reject) {
		return new PromiseNext(this, reject, undefined);
	}

	// $$resolve(thunk, val)
	function $$resolve(thunk, val) {
		if (thunk.flag & PROMISE_FLAG_SOLVED) return;

		if (isPromise(val))
			return val.then(
				function (v) { return $$resolve(thunk, v); },
				function (e) { return $$reject(thunk, e); });

		thunk.result = val;
		thunk.flag = PROMISE_FLAG_RESOLVED;
		if (thunk.head) nextExec(thunk, $$fire);
	} // $$resolve

	// $$reject(thunk, err)
	function $$reject(thunk, err) {
		if (thunk.flag & PROMISE_FLAG_RESOLVED)
			return hasConsoleError && console.error(colors.yellow('* Resolved promise rejected: ') +
				thunk + '\n' + colors.purple('* ' + errmsg(err)));
		if (thunk.flag & PROMISE_FLAG_REJECTED)
			return hasConsoleError && console.error(colors.yellow('* Rejected promise rejected: ') +
				thunk + '\n' + colors.purple('* ' + errmsg(err)));

		thunk.result = (typeof err === 'object' && err instanceof Error) ? err : Error(err);
		thunk.flag = PROMISE_FLAG_REJECTED;
		nextExec(thunk, $$fire);
	} // $$reject

	// $$callback(thunk, err, val)
	function $$callback(thunk, err, val) {
		return err ? $$reject(thunk, err) : $$resolve(thunk, val);
	}
	// thunk.$$callback2(err, val, ...)
	function $$callback2(err, val) {
		switch (arguments.length) {
			case 2: return err instanceof Error ? $$reject(this, err) : $$resolve(this, val);
			case 1: return err instanceof Error ? $$reject(this, err) : $$resolve(this, err);
			case 0: return $$resolve(this);
			default: return err instanceof Error ?
				$$reject(this, err) :
				$$resolve(this, slice.call(arguments, 1));
		}
	}

	// $$fire(thunk)
	function $$fire(thunk) {
		if (!(thunk.flag & PROMISE_FLAG_SOLVED)) return;

		if (thunk.flag & PROMISE_FLAG_REJECTED) var err = thunk.result;
		else var val = thunk.result, err = null;

		var bomb;
		while (bomb = thunk.head) {
			thunk.head = bomb.chain;
			bomb.chain = undefined;
			if (!thunk.head) thunk.tail = undefined;

			fire(bomb.thunk, err, val, bomb.rej, bomb.res);

			if ((thunk.flag & PROMISE_FLAG_UNHANDLED) ===
					PROMISE_FLAG_UNHANDLED_REJECTION)
				$$rejectionHandled(thunk);
			thunk.flag |= PROMISE_FLAG_HANDLED;
		}

		if (thunk.flag === PROMISE_FLAG_REJECTED)
			nextExec(thunk, $$checkUnhandledRejection);
	} // $$fire

	function fire(thunk, err, val, rej, res) {
		try {
			var r =
				err ? (rej ? rej(err) : err) :
				res ? res(val) : undefined;
			firebytype[typeof r](thunk, r);
		} catch (e) { $$reject(thunk, e); }
	} // fire

	var firebytype = {
		number:$$resolve, string:$$resolve, boolean:$$resolve, undefined:$$resolve,
		object: function (thunk, r) {
			if (r === null) $$resolve(thunk, r);
			else if (typeof r.then === 'function')
				r.then(
					function (v) { return $$resolve(thunk, v); },
					function (e) { return $$reject(thunk, e); });
			else if (r instanceof Error) $$reject(thunk, r);
			else $$resolve(thunk, r);
		},
		'function': function (thunk, r) {
			if (typeof r.then === 'function')
				r.then(
					function (v) { return $$resolve(thunk, v); },
					function (e) { return $$reject(thunk, e); });
			else r(function () { return $$callback2.apply(thunk, arguments); });
		}
	};

	// $$checkUnhandledRejection(thunk)
	function $$checkUnhandledRejection(thunk) {
		if (!(thunk.flag & PROMISE_FLAG_UNHANDLED))
			$$unhandledRejection(thunk);
	}

	// $$unhandledRejection(thunk)
	function $$unhandledRejection(thunk) {
		thunk.flag |= PROMISE_FLAG_UNHANDLED_REJECTION;
		if (typeof process === 'object' && process && typeof process.on === 'function')
			process.emit('unhandledRejection', thunk.result, thunk);
		hasConsoleError &&
		console.error(colors.yellow('* UnhandledRejection: ') + thunk +
			colors.purple('\n* ' + errmsg(thunk.result)));
	}

	// $$rejectionHandled(thunk)
	function $$rejectionHandled(thunk) {
		if (typeof process === 'object' && process && typeof process.on === 'function')
			process.emit('rejectionHandled', thunk);
		hasConsoleError &&
		console.error(colors.green('* RejectionHandled:   ') + thunk);
	}

	// Promise.all([p, ...])
	function all(promises) {
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
					if (isPromise(p))
						return p.then(complete, reject);
					complete(p);
				}); // promises.forEach
			}
		); // return new Promise
	} // all

	// Promise.race([p, ...])
	function race(promises) {
		if (isIterator(promises)) promises = makeArrayFromIterator(promises);
		if (!(promises instanceof Array))
			throw new TypeError('promises must be an array');

		return new Promise(
			function promiseRace(resolve, reject) {
				promises.forEach(function (p) {
					if (isPromise(p))
						return p.then(resolve, reject);
					resolve(p);
				}); // promises.forEach
			}
		); // return new Promise
	} // race

	// isPromise(p)
	function isPromise(p) {
		return (typeof p === 'object' && !!p || typeof p === 'function') && typeof p.then === 'function';
	}

	// isIterator(iter)
	function isIterator(iter) {
		return typeof iter === 'object' && !!iter && (typeof iter.next === 'function' || isIterable(iter));
	}

	// isIterable(iter)
	function isIterable(iter) {
		return typeof iter === 'object' && !!iter && typeof Symbol === 'function' &&
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

	// promisify(fn, [options])
	function promisify(fn, options) {
		// promisify(object target, string method, [object options]) : undefined
		if (fn && typeof fn === 'object' && options && typeof options === 'string') {
			var object = fn, method = options, options = arguments[2];
			var suffix = options && typeof options === 'string' ? options :
				options && typeof options.suffix === 'string' ? options.suffix :
				options && typeof options.postfix === 'string' ? options.postfix : 'Async';
			var methodAsyncCached = method + suffix + 'Cached';
			Object.defineProperty(object, method + suffix, {
				get: function () {
					return this.hasOwnProperty(methodAsyncCached) &&
						typeof this[methodAsyncCached] === 'function' ? this[methodAsyncCached] :
						(setValue(this, methodAsyncCached, promisify(this, this[method])), this[methodAsyncCached]);
				},
				configurable: true
			});
			return;
		}

		// promisify([object ctx,] function fn) : function
		var ctx = typeof this !== 'function' ? this : undefined;
		if (typeof options === 'function') ctx = fn, fn = options, options = arguments[2];
		if (options && options.context) ctx = options.context;
		if (typeof fn !== 'function')
			throw new TypeError('promisify: argument must be a function');

		// promisified
		promisified.promisified = true;
		return promisified;

		function promisified() {
			var args = arguments;
			return new Promise(function (res, rej) {
				args[args.length++] = function callback(err, val) {
					try {
						return err instanceof Error ? rej(err) :
							// normal node style callback
							arguments.length === 2 ? (err ? rej(err) : res(val)) :
							// fs.exists like callback, arguments[0] is value
							arguments.length === 1 ? res(arguments[0]) :
							// unknown callback
							arguments.length === 0 ? res() :
							// child_process.exec like callback
							res(slice.call(arguments, err == null ? 1 : 0));
					} catch (e) { rej(e); }
				};
				fn.apply(ctx, args);
			});
		};
	} // promisify

	// thunkify(fn, [options])
	function thunkify(fn, options) {
		// thunkify(object target, string method, [object options]) : undefined
		if (fn && typeof fn === 'object' && options && typeof options === 'string') {
			var object = fn, method = options, options = arguments[2];
			var suffix = options && typeof options === 'string' ? options :
				options && typeof options.suffix === 'string' ? options.suffix :
				options && typeof options.postfix === 'string' ? options.postfix : 'Async';
			var methodAsyncCached = method + suffix + 'Cached';
			Object.defineProperty(object, method + suffix, {
				get: function () {
					return this.hasOwnProperty(methodAsyncCached) &&
						typeof this[methodAsyncCached] === 'function' ? this[methodAsyncCached] :
						(setValue(this, methodAsyncCached, thunkify(this, this[method])), this[methodAsyncCached]);
				},
				configurable: true
			});
			return;
		}

		// thunkify([object ctx,] function fn) : function
		var ctx = typeof this !== 'function' ? this : undefined;
		if (typeof options === 'function') ctx = fn, fn = options, options = arguments[2];
		if (options && options.context) ctx = options.context;
		if (typeof fn !== 'function')
			throw new TypeError('thunkify: argument must be a function');

		// thunkified
		thunkified.thunkified = true;
		return thunkified;

		function thunkified() {
			var result, callbacks = [], unhandled;
			arguments[arguments.length++] = function callback(err, val) {
				if (result) {
					if (err)
						hasConsoleError &&
						console.error(COLOR_ERROR + 'Unhandled callback error: ' + err2str(err) + COLOR_NORMAL);
					return;
				}

				result = arguments;
				if (callbacks.length === 0 && err instanceof Error)
					unhandled = true,
					hasConsoleError &&
					console.error(COLOR_ERROR + 'Unhandled callback error: ' + err2str(err) + COLOR_NORMAL);

				for (var i = 0, n = callbacks.length; i < n; ++i)
					fire(callbacks[i]);
				callbacks = [];
			};
			fn.apply(ctx, arguments);

			// thunk
			return function thunk(cb) {
				if (typeof cb !== 'function')
					throw new TypeError('argument must be a function');

				if (unhandled)
					unhandled = false,
					hasConsoleError &&
					console.error(COLOR_ERROR + 'Unhandled callback error handled: ' + err2str(result[0]) + COLOR_NORMAL);

				if (result) return fire(cb);
				callbacks.push(cb);
			};

			// fire
			function fire(cb) {
				var err = result[0], val = result[1];
				try {
					return err instanceof Error || result.length === cb.length ? cb.apply(ctx, result) :
						// normal node style callback
						result.length === 2 ? cb.call(ctx, err, val) :
						// fs.exists like callback, arguments[0] is value
						result.length === 1 ? cb.call(ctx, null, result[0]) :
						// unknown callback
						result.length === 0 ? cb.call(ctx) :
						// child_process.exec like callback
						cb.call(ctx, null, slice.call(result, err == null ? 1 : 0));
				} catch (e) { cb.call(ctx, e); }
			} // fire
		}; // thunkified
	} // thunkify

	// promisifyAll(object, options)
	function promisifyAll(object, options) {
		var keys = [];
		if (Object.getOwnPropertyNames) keys = Object.getOwnPropertyNames(object);
		else if (Object.keys) keys = Object.keys(object);
		else for (var method in object) if (object.hasOwnProperty(method)) keys.push(i);

		keys.forEach(function (method) {
			if (typeof object[method] === 'function' &&
					!object[method].promisified &&
					!object[method].thunkified)
				promisify(object, method, options);
		});
		return object;
	}

	// thunkifyAll(object, options)
	function thunkifyAll(object, options) {
		var keys = [];
		if (Object.getOwnPropertyNames) keys = Object.getOwnPropertyNames(object);
		else if (Object.keys) keys = Object.keys(object);
		else for (var method in object) if (object.hasOwnProperty(method)) keys.push(i);

		keys.forEach(function (method) {
			if (typeof object[method] === 'function' &&
					!object[method].promisified &&
					!object[method].thunkified)
				thunkify(object, method, options);
		});
		return object;
	}


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

	function err2str(err) {
		return err.stack || (err + '');
	}


	if (!global.Promise) global.Promise = Promise;
	if (!global.PromiseLight) global.PromiseLight = Promise;
	setValue(Promise, 'Promise', Promise);
	setValue(Promise, 'PromiseLight', Promise);

	if (typeof module === 'object' && module && module.exports)
		module.exports = Promise;

	return Promise;

}(Function('return this')(), typeof Promise === 'function' ? Promise : null);
