// Promise

void function (PromiseOrg) {
	'use strict';

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
		if (typeof val === 'object' && val && typeof val.then === 'function')
			return new PromiseConvert(val);
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

		if (typeof val === 'object' && val && typeof val.then === 'function')
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
			return console.error(colors.yellow('* Resolved promise rejected: ') +
				thunk + '\n' + colors.purple('* ' + errmsg(err)));
		if (thunk.flag & PROMISE_FLAG_REJECTED)
			return console.error(colors.yellow('* Rejected promise rejected: ') +
				thunk + '\n' + colors.purple('* ' + errmsg(err)));

		thunk.result = err;
		thunk.flag = PROMISE_FLAG_REJECTED;
		nextExec(thunk, $$fire);
	} // $$reject

	// $$callback(thunk, err, val)
	function $$callback(thunk, err, val) {
		return err ? $$reject(thunk, err) : $$resolve(thunk, val);
	}

	// $$fire(thunk)
	function $$fire(thunk) {
		if (!(thunk.flag & PROMISE_FLAG_SOLVED)) return;

		if (thunk.flag & PROMISE_FLAG_REJECTED) var err = thunk.result;
		else var val = thunk.result;

		var bomb;
		while (bomb = thunk.head) {
			thunk.head = bomb.chain;
			bomb.chain = undefined;
			if (!thunk.head) thunk.tail = undefined;

			fire(bomb.thunk, err, val, bomb.rej, bomb.res);
		}
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
			r(function (e, v) { return $$callback(thunk, e, v); });
		}
	};

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
					if (p instanceof Promise || isPromise(p))
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
					if (p instanceof Promise || isPromise(p))
						return p.then(resolve, reject);
					resolve(p);
				}); // promises.forEach
			}
		); // return new Promise
	} // race

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
