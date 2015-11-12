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
	var ARGS_CALLBACK = 2;
	var ARGS_RESOLVE = 3;
	var ARGS_REJECT = 4;

	// proto
	var proto = PromiseCore.prototype;

	function PROMISE_RESOLVE() {}
	function PROMISE_REJECT() {}
	function PROMISE_THEN() {}

	// PromiseCore
	function PromiseCore(setup, val, rej, cb, pp) {

		//var $this = function (callback) {
		//	return new PromiseCore(PROMISE_THEN, null, null, callback, $this);
		//};

		var $this = this;

		$this.$callbacks = [];
		//$this.$state = STATE_UNRESOLVED;
		//$this.$result = undefined;
		//$this.$handled = false;

		//if ($this.constructor !== PromiseCore)
		//	setProto($this, proto);
/*
		if ($this.constructor !== PromiseCore) {
			setProto($this, proto);

			if ($this.then !== proto.then)
				Object.getOwnPropertyNames(proto).forEach(p =>
					Object.defineProperty($this, p, {writable: true, configurable: true, value: proto[p]}));
		}
*/

		if (typeof setup === 'function') {

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
				pp.$callbacks.push([val, rej, cb, resolve, reject]);
				if (pp.$state !== STATE_UNRESOLVED)
					nextTickDo(function () { pp.$fire(); });
				return $this;
			}
			else {
				setup(resolve, reject);
			}
		}

		return $this;

		function resolve(val) {
			if ($this.$state !== STATE_UNRESOLVED) return;

			if (val && val.then)
				return val.then(
					function (v) {
						$this.$state = STATE_RESOLVED;
						$this.$result = v;
						//$this.$next();
						nextTickDo(function () { $this.$fire(); });
					},
					function (e) {
						$this.$reject(e);
					}), undefined;

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

	// initial values into prototype (primitives only)
	proto.$state = STATE_UNRESOLVED;
	proto.$result = undefined;
	proto.$handled = false;

	// then
	proto.then = function then(resolved, rejected) {
		return new PromiseCore(PROMISE_THEN, rejected, resolved, null, this);
	};

	// catch
	proto['catch'] = function caught(rejected) {
		return new PromiseCore(PROMISE_THEN, rejected, null, null, this);
	};

	// fire
	proto.$fire = function fire() {
		//if (this.$state === STATE_UNRESOLVED) return;
		var $this = this;
		var $state = this.$state;
		var $result = this.$result;
		var $callbacks = this.$callbacks;
		var elem;

		while (elem = $callbacks.shift()) {
			(function (elem) {
				var resolve = elem[ARGS_RESOLVE], reject = elem[ARGS_REJECT];
				var r;
				var cb = elem[ARGS_CALLBACK];
				var completed = elem[$state];
				//function complete(val) {
				//	resolve(completed.call($this, val)); }

				$this.$handled = true;

				try {
					if (completed)
						r = completed.call(null, $result);
					else if (cb)
						r = cb.apply(null,
							$state === STATE_RESOLVED ?
								[null, $result] : [$result]);
					else if ($state === STATE_REJECTED)
						return reject($result);
					else
						return resolve();

					if (typeof r === 'function')
						r(function (e, v) { return e ? reject(e) : resolve(v); });
					else
						resolve(r);
				} catch (e) {
					try {
						reject(e);
					}
					catch (e2) {
						console.error(colors.purple(
							'error in handler: ' +
							$this + ': ' + e.stack + '\n' + e2.stack));
					}
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
