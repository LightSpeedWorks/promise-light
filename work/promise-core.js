(function () {
	'use strict';

	var COLORS = {red: '31', green: '32', purple: '35', cyan: '36', yellow: '33'};
	var colors = Object.keys(COLORS).reduce(function (obj, k) {
		obj[k] = typeof window === 'object' ? function (x) { return x; } :
			function (x) { return '\x1b[' + COLORS[k] + 'm' + x + '\x1b[m'; };
		return obj;
	}, {});

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
	var getProto = Object.getPrototypeOf || {}.__proto__ ?
		function getProto(obj) { return obj.__proto__; } : null;

	// setProto
	var setProto = typeof Object.setPrototypeOf === 'function' ?
		Object.setPrototypeOf : function (obj, proto) { obj.__proto__ = proto; };

	// nextTickDo(fn)
	var nextTickDo = typeof setImmediate === 'function' ? setImmediate :
		typeof process !== 'undefined' && process &&
		typeof process.nextTick === 'function' ? process.nextTick :
		function nextTickDo(fn) { setTimeout(fn, 0); };

	// base-class-extend
	function extend(proto, statics) {
		var ctor = proto.constructor;
		function super_() {
			setValue(this, 'constructor', ctor);
			//this.constructor = ctor;
		}
		super_.prototype = this.prototype;
		ctor.prototype = new super_();
		for (var p in proto)
			if (proto.hasOwnProperty(p))
				setValue(ctor.prototype, p, proto[p]);
				//ctor.prototype[p] = proto[p];
		for (var p in statics)
			if (statics.hasOwnProperty(p))
				setValue(ctor, p, statics[p]);
				//ctor[p] = statics[p];
		return ctor;
	}

	// Queue
	var Queue = extend.call(Object, {
		constructor: function Queue() {
			if (!(this instanceof Queue)) return new Queue();
			this.tail = this.head = undefined;
		},
		push: function push(x) {
			if (this.tail)
				this.tail = this.tail.next = {data:x, next:undefined};
			else
				this.tail = this.head = {data:x, next:undefined};
		},
		shift: function shift() {
			if (!this.head) return undefined;
			var x = this.head.data;
			this.head = this.head.next;
			if (!this.head) this.tail = undefined;
			return x;
		}
	});

	// Queue2
	var Queue2 = extend.call(Object, {
		constructor: function Queue() {
			if (!(this instanceof Queue)) return new Queue();
			this.tail = this.head = undefined;
		},
		push: function push(x, y) {
			if (this.tail)
				this.tail = this.tail.next = {x:x, y:y, next:undefined};
			else
				this.tail = this.head = {x:x, y:y, next:undefined};
		},
		shift: function shift() {
			if (!this.head) return undefined;
			var x = this.head;
			this.head = this.head.next;
			if (!this.head) this.tail = undefined;
			x.next = undefined;
			return x;
		}
	});

	var nextTickTasks = new Queue2();
	var nextTickProgress = false;
	// nextTick2(ctx, fn)
	function nextTick2(ctx, fn) {
		nextTickTasks.push(ctx, fn);
		if (nextTickProgress) return;

		nextTickProgress = true;

		nextTickDo(function (obj) {
			while (obj = nextTickTasks.shift())
				obj.y.call(obj.x);
			nextTickProgress = false;
		});
	}

	var STATE_UNRESOLVED = -1;
	var STATE_REJECTED = 0;
	var STATE_RESOLVED = 1;
	var ARGS_RESOLVE = 2;
	var ARGS_REJECT = 3;

//	function PROMISE_RESOLVE() {}
//	function PROMISE_REJECT() {}
	function PROMISE_THEN() {}
	function PROMISE_DEFER() {}

	// PromiseCore
	var PromiseCore = extend.call(Object, {

		// initial values into prototype (primitives only)
		$state: STATE_UNRESOLVED,
		$result: undefined,
		$handled: false,

		constructor: function PromiseCore(setup, val, res, parent) {

/*
			var $this = function (callback) {
				return new this.constructor(PROMISE_THEN,
					function (e) { return e instanceof Error ? callback(e) : callback(Error(e)); },
					function (v) { return v instanceof Error ? callback(v) : callback(null, v); },
					$this);
			};
			if ($this.constructor !== this.constructor) {
				setProto($this, this.constructor.prototype);
				//if ($this.then !== this.constructor.prototype.then)
				//	Object.getOwnPropertyNames(this.constructor.prototype).forEach(p =>
				//		Object.defineProperty($this, p, {writable: true, configurable: true, value: proto[p]}));
			}
*/
			var $this = this;

			// Queue { head, tail }
			$this.tail = $this.head = undefined;

			$this.$state = STATE_UNRESOLVED;
			$this.$result = undefined;
			$this.$handled = false;

			if (setup === PROMISE_DEFER) {
				return {promise: $this, resolve:resolve, reject:reject};
			}
			else if (setup === PROMISE_THEN) {
				parent.push([val, res, resolve, reject]);
				if (parent.$state !== STATE_UNRESOLVED)
					nextTick2(parent, $fire);
			}
/*
			else if (setup === PROMISE_RESOLVE) {
				$this.$state = STATE_RESOLVED;
				$this.$result = val;
				nextTick2($this, $fire);
			}
			else if (setup === PROMISE_REJECT) {
				$this.$state = STATE_REJECTED;
				$this.$result = val;
				nextTick2($this, $fire);
			}
*/
			else if (typeof setup === 'function') {
				try {
					setup(resolve, reject);
				} catch (err) {
					resolve(err);
				}
			}

			return $this;

			function resolve(val) {
				if ($this.$state !== STATE_UNRESOLVED) return;

				$this.$state = STATE_RESOLVED;
				$this.$result = val;
				nextTick2($this, $fire);
			}

			function reject(err) {
				if ($this.$state === STATE_RESOLVED)
					return console.error(colors.purple(
						'resolved promise rejected: ' +
						$this + ': ' + err));

				if ($this.$state === STATE_REJECTED)
					return console.error(colors.purple(
						'rejected twice: ' +
						$this + ': ' + err));

				$this.$state = STATE_REJECTED;
				$this.$result = err;
				nextTick2($this, $fire);
			}
		},

		// push
		push: function push(x) {
			if (this.tail)
				this.tail = this.tail.next = {data:x, next:undefined};
			else
				this.tail = this.head = {data:x, next:undefined};
		},

		// shift
		shift: function shift() {
			if (!this.head) return undefined;
			var x = this.head.data;
			this.head = this.head.next;
			if (!this.head) this.tail = undefined;
			return x;
		},

		// then
		then: function then(resolved, rejected) {
			return new this.constructor(PROMISE_THEN, rejected, resolved, this);
		},

		// catch
		'catch': function caught(rejected) {
			return new this.constructor(PROMISE_THEN, rejected, null, this);
		},

		// fire
		$fire: $fire,

		// check
		$check: $check,

		// toString
		toString: function toString() {
			return colors.cyan(this.constructor.name + ' { ') + (
				this.$state === STATE_RESOLVED ? colors.green('<resolved ' + this.$result + '>'):
				this.$state === STATE_REJECTED ? colors.red('<rejected ' + this.$result + '>'):
				colors.yellow('<pending>')) + colors.cyan(' }');
		},

		// toJSON
		toJSON: function toJSON() {
			var obj = {'class': this.constructor.name};
			obj.state = ['pending', 'rejected', 'resolved'][this.$state + 1];
			if (this.$state === STATE_RESOLVED) obj.value = this.$result;
			if (this.$state === STATE_REJECTED) obj.error = '' + this.$result;
			return obj;
		}
	},

	// statics
	{

		// defer
		defer: function defer() {
			return new this(PROMISE_DEFER);
		},

		// all
		all: function all(promises) {
			var $thisClass = this;
			if (isIterator(promises)) promises = makeArrayFromIterator(promises);
			if (!(promises instanceof Array))
				throw new TypeError('promises must be an array');

			return new this(
				function promiseAll(resolve, reject) {
					var n = promises.length;
					if (n === 0) return resolve([]);
					var res = Array(n);
					promises.forEach(function (p, i) {
						function complete(val) {
							res[i] = val; if (--n === 0) resolve(res); }
						function error(err) {
							if (n > 0) reject(err); n = 0; }
						if (p instanceof $thisClass || isPromise(p))
							return p.then(complete, error);
						complete(p);
					}); // promises.forEach
				}
			); // return new this
		},

		// race
		race: function race(promises) {
			var $thisClass = this;
			if (isIterator(promises)) promises = makeArrayFromIterator(promises);
			if (!(promises instanceof Array))
				throw new TypeError('promises must be an array');

			return new this(
				function promiseRace(resolve, reject) {
					promises.forEach(function (p) {
						if (p instanceof $thisClass || isPromise(p))
							return p.then(resolve, reject);
						resolve(p);
					}); // promises.forEach
				}
			); // return new this
		},

		// accept
		accept: function accept(val) { return new PromiseCoreResolved(val); },

		// resolve
		//resolve: function (val) { return new this.constructor(PROMISE_RESOLVE, val); },
		resolve: function resolve(val) { return new PromiseCoreResolved(val); },

		// resolve
		//reject: function (err) { return new this.constructor(PROMISE_REJECT, err); },
		reject: function reject(err) { return new PromiseCoreRejected(err); },

		// isPromise(p)
		isPromise: isPromise,

		// isIterator(iter)
		isIterator: isIterator,

		// isIterable(iter)
		isIterable: isIterable,

		// makeArrayFromIterator
		makeArrayFromIterator: makeArrayFromIterator

	}); // extend PromiseCore

	// fire
	function $fire() {
		var $this = this;
		var $state = this.$state;
		var $result = this.$result;
		var elem;

		if ($result instanceof Error) $state = STATE_REJECTED;

		while (elem = this.shift()) {
			var resolve = elem[ARGS_RESOLVE];
			var reject = elem[ARGS_REJECT];
			var completed = elem[$state];

			this.$handled = true;

			if (!completed) {
				if ($state === STATE_RESOLVED)
					resolve($result);
				else
					reject($result);
				continue;
			}
			// TODO check spec: resolve($result or undefined?)

			void function (resolve, reject, completed) {

				if ($state === STATE_RESOLVED) {
					if ($result && $result.then)
						return $result.then(complete, reject);

					if (typeof $result === 'function')
						return $result(function (e, v) {
							return e ? reject(e) : complete(v);
						});
				}
				complete($result);

				function complete(val) {
					try {
						resolve(completed(val));
					} catch (err) {
						if ($state === STATE_REJECTED)
							console.error(colors.purple(
								'error in handler: ') + $this +
								colors.purple(': ' + (val && val.stack || val)));
						reject(err);
					}
				};

			} (resolve, reject, completed);

		} // while

		if (!this.$handled && $state === STATE_REJECTED)
			nextTick2(this, $check);

	} // fire

	// check unhandled rejection
	function $check() {
		if (!this.$handled)
			console.error(colors.purple('unhandled rejection: ' + this));
	}

	// check unhandled rejection
	function $check2() {
		nextTick2(this, $check);
	}

	// PromiseCoreResolved
	var PromiseCoreResolved = extend.call(PromiseCore, {
		constructor: function PromiseCoreResolved(val) {
			this.$state = STATE_RESOLVED;
			this.$result = val;
			this.$handled = false;
		},

		// then
		then: function then(resolved, rejected) {
			return new PromiseCore(PROMISE_THEN, rejected, resolved, this);
		},

		// catch
		'catch': function caught(rejected) {
			return promiseCoreResolved;
		},

		// push
		push: function push(x) {
			var $this = this;
			var val = $this.$result;
			var resolve  = x[ARGS_RESOLVE];
			var reject   = x[ARGS_REJECT];
			var resolved = x[STATE_RESOLVED];
			if (val && val.then)
				val.then(function (val) {
						resolve(resolved(val));
				}, reject);
			else
				nextTick2(undefined, function () {
					try {
						resolve(resolved(val));
					} catch (e) {
						reject(e);
					}
				});
		}
	}); // PromiseCoreResolved
	var promiseCoreResolved = new PromiseCoreResolved();


	// PromiseCoreRejected
	var PromiseCoreRejected = extend.call(PromiseCore, {
		constructor: function PromiseCoreRejected(err) {
			this.$state = STATE_REJECTED;
			this.$result = err;
			this.$handled = false;
			nextTick2(this, $check2);
		},

		// then
		then: function then(resolved, rejected) {
			return new PromiseCore(PROMISE_THEN, rejected, resolved, this);
		},

		// catch
		'catch': function caught(rejected) {
			return new PromiseCore(PROMISE_THEN, rejected, undefined, this);
		},

		// push
		push: function push(x) {
			var $this = this;
			var resolve  = x[ARGS_RESOLVE];
			var reject   = x[ARGS_REJECT];
			var rejected = x[STATE_REJECTED];
			nextTick2(undefined, function () {
				var err = $this.$result;
				try {
					resolve(rejected(err));
				} catch (e) {
					console.error(colors.purple(
						'error in handler: ') + $this +
						colors.purple(': ' + (err && err.stack || err)));
					reject(e);
				}
			});
		}
	}); // PromiseCoreRejected

	// isPromise
	function isPromise(p) {
		return !!p && typeof p.then === 'function';
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

	// makeArrayFromIterator
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

	if (typeof module === 'object' && module && module.exports)
		module.exports = PromiseCore;

	if (typeof window !== 'undefined')
		window.PromiseCore = PromiseCore;

	return PromiseCore;

})();
