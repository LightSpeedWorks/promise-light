(function () {
	'use strict';

	var COLORS = {red: '31', green: '32', purple: '35', cyan: '36'};
	var colors = Object.keys(COLORS).reduce(function (obj, k) {
		obj[k] = typeof window === 'object' ? function (x) { return x; } :
			function (x) { return '\x1b[' + COLORS[k] + 'm' + x + '\x1b[m'; };
		return obj;
	}, {});

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
		function super_() { this.constructor = ctor; }
		super_.prototype = this.prototype;
		ctor.prototype = new super_();
		for (var p in proto)
			if (proto.hasOwnProperty(p))
				//ctor.prototype[p] = proto[p];
				Object.defineProperty(ctor.prototype, p,
					{writable: true, configurable: true, value: proto[p]});
		for (var p in statics)
			if (statics.hasOwnProperty(p))
				//ctor[p] = statics[p];
				Object.defineProperty(ctor, p,
					{writable: true, configurable: true, value: statics[p]});
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

	var STATE_UNRESOLVED = -1;
	var STATE_REJECTED = 0;
	var STATE_RESOLVED = 1;
	var ARGS_RESOLVE = 2;
	var ARGS_REJECT = 3;

	function PROMISE_RESOLVE() {}
	function PROMISE_REJECT() {}
	function PROMISE_THEN() {}

	// PromiseCore
	var PromiseCore = extend.call(Object, {

		// initial values into prototype (primitives only)
		$state: STATE_UNRESOLVED,
		$result: undefined,
		$handled: false,

		constructor: function PromiseCore(setup, val, res, pp) {

/*
			var $this = function (callback) {
				return new PromiseCore(PROMISE_THEN,
					function (e) { return e instanceof Error ? callback(e) : callback(Error(e)); },
					function (v) { return v instanceof Error ? callback(v) : callback(null, v); },
					$this);
			};
			if ($this.constructor !== PromiseCore) {
				setProto($this, PromiseCore.prototype);
				//if ($this.then !== PromiseCore.prototype.then)
				//	Object.getOwnPropertyNames(PromiseCore.prototype).forEach(p =>
				//		Object.defineProperty($this, p, {writable: true, configurable: true, value: proto[p]}));
			}
*/
			var $this = this;

			$this.$callbacks = new Queue;

			if (setup === PROMISE_RESOLVE) {
				$this.$state = STATE_RESOLVED;
				$this.$result = val;
				nextTickDo(function () { $this.$fire(); });
			}
			else if (setup === PROMISE_REJECT) {
				$this.$state = STATE_REJECTED;
				$this.$result = val;
				nextTickDo(function () { $this.$fire(); });
			}
			else if (setup === PROMISE_THEN) {
				pp.$callbacks.push([val, res, resolve, reject]);
				if (pp.$state !== STATE_UNRESOLVED)
					nextTickDo(function () { pp.$fire(); });
			}
			else if (typeof setup === 'function') {
				setup(resolve, reject);
			}

			return $this;

			function resolve(val) {
				if ($this.$state !== STATE_UNRESOLVED) return;

				$this.$state = STATE_RESOLVED;
				$this.$result = val;
				nextTickDo(function () { $this.$fire(); });
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
				nextTickDo(function () { $this.$fire(); });
			}
		},

		// then
		then: function then(resolved, rejected) {
			return new PromiseCore(PROMISE_THEN, rejected, resolved, this);
		},

		// catch
		'catch': function caught(rejected) {
			return new PromiseCore(PROMISE_THEN, rejected, null, this);
		},

		// fire
		$fire: function fire() {
			var $this = this;
			var $state = this.$state;
			var $result = this.$result;
			var $callbacks = this.$callbacks;
			var elem;

			if ($result instanceof Error) $state = STATE_REJECTED;

			while (elem = $callbacks.shift()) {
				var resolve = elem[ARGS_RESOLVE];
				var reject = elem[ARGS_REJECT];
				var completed = elem[$state];

				$this.$handled = true;

				if (!completed)
					return ($state === STATE_RESOLVED ? resolve : reject) ($result);
					// TODO check spec: resolve($result or undefined?)

				var complete = function () {
					return function complete(val) {
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
				} (resolve, reject);

				if ($state === STATE_RESOLVED) {
					if ($result && $result.then)
						return function (complete, reject) {
							return $result.then(complete, reject);
						} (complete, reject);

					if (typeof $result === 'function')
						return $result(function (complete, reject) {
							return function (e, v) {
								return e ? reject(e) : complete(v);
							}
						} (complete, reject));
				}
				complete($result);

			} // while

			if (!this.$handled && this.$state === STATE_REJECTED)
				nextTickDo(function () { $this.$check(); });
		},

		// check
		$check: function check() {
			if (!this.$handled) console.error(colors.purple('unhandled rejection: ' + this));
		},

		// next
		$next: function next() {
			if (this.$state === STATE_UNRESOLVED) return;
			var $this = this;
			nextTickDo(function () { $this.$fire(); });
		},

		// toString
		toString: function toString() {
			return colors.cyan('PromiseCore ') + (
				this.$state === STATE_RESOLVED ? colors.green('<resolved ' + this.$result + '>'):
				this.$state === STATE_REJECTED ? colors.red('<rejected ' + this.$result + '>'):
				'<pending>');
		},

		// toJSON
		toJSON: function toJSON() {
			var obj = {'class': 'PromiseCore'};
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
			var resolved, rejected;
			var p = new PromiseCore(function (res, rej) { resolved = res; rejected = rej; });
			return {promise: p, resolve: resolved, reject:  rejected};
		},

		all: Promise.all,
		race: Promise.race,

		// resolve
		resolve: function (val) { return new PromiseCore(PROMISE_RESOLVE, val); },

		// resolve
		reject: function (err) { return new PromiseCore(PROMISE_REJECT, err); },

		// isPromise
		isPromise: isPromise

	}); // extend

	function isPromise(p) {
		return !!p && typeof p.then === 'function';
	}

	//for (var p in PromiseCore.prototype) {
	//	var v = PromiseCore.prototype[p];
	//	delete PromiseCore.prototype[p];
	//	Object.defineProperty(PromiseCore.prototype, p, {writable: true, configurable: true, value: v});
	//}

	if (typeof module === 'object' && module && module.exports)
		module.exports = PromiseCore;

	if (typeof window !== 'undefined')
		window.PromiseCore = PromiseCore;

	return PromiseCore;

})();
