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

	var STATE_UNRESOLVED = 0;
	var STATE_REJECTED = 1;
	var STATE_RESOLVED = 2;
	var ARGS_CALLBACK = 3;
	var ARGS_PROMISE = 0;
	var ARGS_PARENT_PROMISE = 4;

	// proto
	var proto = PromiseCore.prototype;

	function PROMISE_RESOLVE() {}
	function PROMISE_REJECT() {}
	function PROMISE_THEN() {}

	// PromiseCore
	function PromiseCore(setup, val) {

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

			if (setup === PROMISE_THEN) {
				var pp = arguments[ARGS_PARENT_PROMISE];
				arguments[ARGS_PROMISE] = $this;
				delete arguments[--arguments.length];
				pp.$callbacks.push(arguments);
				if (pp.$state !== STATE_UNRESOLVED) nextTickDo(function () { pp.$fire(); }); //pp.$next();
				return $this;
			}

			if (setup === PROMISE_RESOLVE)
				return $this.$resolve(val), $this;

			if (setup === PROMISE_REJECT)
				return $this.$reject(val), $this;

			setup(resolve, reject);
		}

		function resolve(v) { $this.$resolve(v); }
		function reject(e) { $this.$reject(e); }
		return $this;
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

	// resolve
	proto.$resolve = function resolve(val) {
		if (this.$state !== STATE_UNRESOLVED) return;
		var $this = this;
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

		this.$state = STATE_RESOLVED;
		this.$result = val;
		//this.$next();
		nextTickDo(function () { $this.$fire(); });
	};

	// reject
	proto.$reject = function reject(err) {
		if (this.$state === STATE_RESOLVED)
			return console.error(colors.purple('resolved promise rejected: ' + this + ': ' + err));
		if (this.$state === STATE_REJECTED)
			return console.error(colors.purple('rejected twice: ' + this + ': ' + err));

		var $this = this;
		this.$state = STATE_REJECTED;
		this.$result = err;
		//this.$next();
		nextTickDo(function () { $this.$fire(); });
	};

	// fire
	proto.$fire = function fire() {
		if (this.$state === STATE_UNRESOLVED) return;
		var $this = this;
		var state = this.$state;
		var callbacks = this.$callbacks;
		this.$callbacks = [];
		//callbacks.forEach((callback) => {
		for (var i = 0, n = callbacks.length; i < n; ++i) {
			var callback = callbacks[i];

			try {
				var p = callback[ARGS_PROMISE], r;
				var s = callback[state];
				var cb = callback[ARGS_CALLBACK];

				$this.$handled = true;

				if (s)
					r = s.call(null, $this.$result);
				else if (cb)
					r = cb.apply(null,
						state === STATE_RESOLVED ?
							[null, $this.$result] : [$this.$result]);
				else if (state === STATE_REJECTED)
					return p.$reject($this.$result);
				else
					return p.$resolve();

				if (typeof r === 'function')
					(function (p, r) {
						r(function (e, v) { return e ? p.$reject(e) : p.$resolve(v); });
					})(p, r);
				else
					p.$resolve(r);
			} catch (e) {
				try {
					p.$reject(e);
				}
				catch (e2) {
					console.error(colors.purple('error in handler: ' + $this + ': ' + e.stack + '\n' + e2.stack));
				}
			}

		} // for

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
