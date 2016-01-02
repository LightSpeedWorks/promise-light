// thunk ... chainable thunk

this.Thunk = function () {
	'use strict';

	var slice = [].slice;

	var nextTick = require('./next-tick');


	// Thunk
	function Thunk(setup) {
		var args, pos = 0, len = 0;
		try{ setup(cb); } catch (e) { cb(e); }
		return thunk;

		function cb(err, val) {
			if (args) return args[0] ?
				err ? console.log('rejected twice:', err, args[0]) : console.log('resolved after rejected:', val, args[0]) :
				err ? console.log('rejected after resolved:', err, args[1]) : console.log('resolved twice:', val, args[1]);
			args = arguments;
			pos < len && nextTick(fire);
		} // cb

		function thunk(cb) {
			thunk[len++] = cb;
			args && nextTick(fire);
			return Thunk(function (next) { cb.next = next; });
		} // thunk

		function fire() {
			for (; pos < len; ++pos) {
				var cb = thunk[pos], next = cb.next;
				try {
					var r = cb.apply(null, args);
					if (typeof r === 'function') r(next);
					else if (r && r.then) r.then(function (v) { next(null, v); }, next);
					else if (r instanceof Error) next(r);
					else next(null, r);
				} catch (e) { next(e); }
			}
		} // fire
	} // Thunk

	if (typeof module === 'object' && module && module.exports)
		module.exports = Thunk;

	return Thunk;

}();
