// thunk1 ... chainable thunk

this.Thunk1 = function () {
	'use strict';

	var slice = [].slice;

	var nextTick = require('./next-tick');


	function Thunk1(setup) {
		var callback, next, args;
		try { setup(cb); } catch (e) { cb(e); }
		return thunk;

		function thunk(cb) {
			callback = cb;
			args && nextTick(fire);
			return Thunk1(function (cb) { next = cb; });
		} // thunk

		function cb(err, val) {
			args = arguments;
			callback && nextTick(fire);
		} // cb

		function fire() {
			try {
				var r = callback.apply(null, args);
				if (typeof r === 'function') r(next);
				else if (r && r.then) r.then(function (v) { next(null, v); }, next);
				else if (r instanceof Error) next(r);
				else next(null, r);
			} catch (e) { next(e); }
		} // fire
	} // Thunk1

	if (typeof module === 'object' && module && module.exports)
		module.exports = Thunk1;

	return Thunk1;

}();
