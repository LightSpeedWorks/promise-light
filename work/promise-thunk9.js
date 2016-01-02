// PromiseThunk

this.PromiseThunk = function () {
	'use strict';

	var slice = [].slice;

	var nextTick = require('./next-tick');


	// PromiseThunk
	function PromiseThunk(setup) {
		var args, pos = 0, len = 0;
		try{ setup(resolve, reject); }
		catch (err) { reject(err); }

		thunk.then = function (resolve, reject) {
			thunk[len++] = cb;
			return PromiseThunk(function (resolve, reject) { cb.next = reject; });

			function cb(err, val) {
				return err ? reject ? reject(err) : err : resolve ? resolve(val) : undefined;
			}
		}; // then

		thunk['catch'] = function (reject) {
			thunk[len++] = cb;
			return PromiseThunk(function (resolve, reject) { cb.next = reject; });

			function cb(err, val) {
				return err ? reject ? reject(err) : err : undefined;
			}
		}; // catch

		return thunk;

		function resolve(val) {
			if (args) return args[0] ?
				console.log('resolved after rejected:', val, args[0]) :
				console.log('resolved twice:', val, args[1]);
			args = [null, arguments.length < 2 ? val : slice.call(arguments)];
			pos < len && nextTick(fire);
		} // resolve

		function reject(err, val) {
			if (args) return args[0] ?
				err ? console.log('rejected twice:', err, args[0]) : console.log('resolved after rejected:', val, args[0]) :
				err ? console.log('rejected after resolved:', err, args[1]) : console.log('resolved twice:', val, args[1]);
			args = arguments;
			pos < len && nextTick(fire);
		} // reject

		function thunk(cb) {
			thunk[len++] = cb;
			args && nextTick(fire);
			return PromiseThunk(function (resolve, reject) { cb.next = reject; });
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
				thunk[pos] = undefined;
			}
		} // fire
	} // PromiseThunk

	if (typeof module === 'object' && module && module.exports)
		module.exports = PromiseThunk;

	return PromiseThunk;

}();
