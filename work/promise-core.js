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
		typeof process !== 'undefined' && process && typeof process.nextTick === 'function' ? process.nextTick :
		function nextTickDo(fn) { setTimeout(fn, 0); };

	var STATE_UNRESOLVED = -1;
	var STATE_REJECTED = 0;
	var STATE_RESOLVED = 1;
	var ARGS_RESOLVE = 2;
	var ARGS_REJECT = 3;

	function PROMISE_RESOLVE() {}
	function PROMISE_REJECT() {}
	function PROMISE_THEN() {}

	// proto
	var proto = PromiseCore.prototype;

	// initial values into prototype (primitives only)
	proto.$state = STATE_UNRESOLVED;
	proto.$result = undefined;
	proto.$handled = false;

	// PromiseCore
	function PromiseCore(setup, val, res, pp) {
/*
		var $this = function (callback) {
			return new PromiseCore(PROMISE_THEN,
				function (e) { return e instanceof Error ? callback(e) : callback(Error(e)); },
				function (v) { return v instanceof Error ? callback(v) : callback(null, v); },
				$this);
		};
		if ($this.constructor !== PromiseCore) {
			setProto($this, proto);
//			if ($this.then !== proto.then)
//				Object.getOwnPropertyNames(proto).forEach(p =>
//					Object.defineProperty($this, p, {writable: true, configurable: true, value: proto[p]}));
		}
*/
		var $this = this;

		$this.$callbacks = [];

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
	}

	// then
	proto.then = function then(resolved, rejected) {
		return new PromiseCore(PROMISE_THEN, rejected, resolved, this);
	};

	// catch
	proto['catch'] = function caught(rejected) {
		return new PromiseCore(PROMISE_THEN, rejected, null, this);
	};

	// fire
	proto.$fire = function fire() {
		var $this = this;
		var $state = this.$state;
		var $result = this.$result;
		var $callbacks = this.$callbacks;
		var elem;

		if ($result instanceof Error) $state = STATE_REJECTED;

		while (elem = $callbacks.shift()) {
			(function (elem) {
				var resolve = elem[ARGS_RESOLVE];
				var reject = elem[ARGS_REJECT];
				var completed = elem[$state];

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
				}

				$this.$handled = true;

				try {
					if ($state === STATE_RESOLVED) {
						if (!completed)
							return resolve($result);

						if ($result && $result.then)
							return $result.then(complete, reject);

						if (typeof $result === 'function')
							return $result(function (e, v) {
								return e ? reject(e) : resolve(v);
							});
					}
					else { // $state === STATE_REJECTED
						if (!completed)
							return reject($result);
					}
					complete($result);
				} catch (err) {
					reject(err);
				}
			})(elem);

		} // while

		if (!this.$handled && this.$state === STATE_REJECTED)
			nextTickDo(function () { $this.$check(); });
	};

	// check
	proto.$check = function check() {
		if (!this.$handled) console.error(colors.purple('unhandled rejection: ' + this));
	};

	// next
	proto.$next = function next() {
		if (this.$state === STATE_UNRESOLVED) return;
		var $this = this;
		nextTickDo(function () { $this.$fire(); });
	};

	// toString
	proto.toString = function toString() {
		return colors.cyan('PromiseCore ') + (
			this.$state === STATE_RESOLVED ? colors.green('<resolved ' + this.$result + '>'):
			this.$state === STATE_REJECTED ? colors.red('<rejected ' + this.$result + '>'):
			'<pending>');
	};

	// toJSON
	proto.toJSON = function toJSON() {
		var obj = {'class': 'PromiseCore'};
		obj.state = ['pending', 'rejected', 'resolved'][this.$state + 1];
		if (this.$state === STATE_RESOLVED) obj.value = this.$result;
		if (this.$state === STATE_REJECTED) obj.error = '' + this.$result;
		return obj;
	};

	// defer
	PromiseCore.defer = function defer() {
		var resolved, rejected;
		var p = new PromiseCore(function (res, rej) { resolved = res; rejected = rej; });
		return {promise: p, resolve: resolved, reject:  rejected};
	};

	PromiseCore.all = Promise.all;
	PromiseCore.race = Promise.race;

	// resolve
	//PromiseCore.resolve = (val) => new PromiseCore((res, rej) => res(val));
	PromiseCore.resolve = function (val) { return new PromiseCore(PROMISE_RESOLVE, val); };

	// resolve
	//PromiseCore.reject = (err) => new PromiseCore((res, rej) => rej(err));
	PromiseCore.reject = function (err) { return new PromiseCore(PROMISE_REJECT, err); };

	// isPromise
	PromiseCore.isPromise = isPromise;
	function isPromise(p) {
		return !!p && typeof p.then === 'function';
	}

	for (var p in proto) {
		var v = proto[p];
		delete proto[p];
		Object.defineProperty(proto, p, {writable: true, configurable: true, value: v});
	}

	if (typeof module === 'object' && module && module.exports)
		module.exports = PromiseCore;

	if (typeof window !== 'undefined')
		window.PromiseCore = PromiseCore;

	return PromiseCore;

})();
