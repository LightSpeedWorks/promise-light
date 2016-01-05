// thunk ... chainable thunk

void function () {
	'use strict';

	var slice = [].slice;

	var nextTickDo = process.nextTick;

	// nextTick(fn, args,...)
	var nextTick = function () {
		var NEXT_MAX = 50;
		var count = 0;
		var progress = false;
		var head = undefined;
		var tail = undefined;

		function nextTick(/* cb, err, val,... */) {
			if (head)
				return tail = tail.next_next = arguments;
			head = tail = arguments;
			if (progress) return;
			progress = true;
			++count >= NEXT_MAX ? (count = 0, nextTickDo(nextTask)) : nextTask();
		}

		var argscbs = [
			function (args) { return undefined; },
			function (args) { return args[0](); },
			function (args) { return args[0](args[1]); },
			function (args) { return args[0](args[1], args[2]); },
			function (args) { return args[0](args[1], args[2], args[3]); },
			function (args) { return args[0](args[1], args[2], args[3], args[4]); }
		];

		function nextTask() {
			while (head) {
				var args = head;
				if (head === tail)
					head = tail = undefined;
				else
					head = head.next_next;
				argscbs[args.length](args);
			}
			progress = false;
		}

		return nextTick;
	}();


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


	function wait0(ms, val) {
		return function (cb) {
			setTimeout(cb, ms, null, val);
		};
	}

	function wait1(ms, val) {
		return new Thunk1(function (cb) {
			setTimeout(cb, ms, null, val);
		});
	}

	function wait2(ms, val) {
		return new PromiseLight(function (resolve, reject) {
			setTimeout(resolve, ms, val);
		});
	}

	function wait3(ms, val) {
		return new Thunk(function (cb) {
			setTimeout(cb, ms, null, val);
		});
	}

	function wait4(ms, val) {
		return new PromiseThunk(function (resolve, reject) {
			setTimeout(resolve, ms, val);
		});
	}


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


	// PromiseLight
	function PromiseLight(setup) {
		var args, pos = 0, that = this;
		this.len = 0;
		try{ setup(resolve, reject); }
		catch (err) { reject(err); }

		return;

		function resolve(val) {
			if (args) return args[0] ?
				console.log('resolved after rejected:', val, args[0]) :
				console.log('resolved twice:', val, args[1]);
			args = [null, arguments.length < 2 ? val : slice.call(arguments)];
			pos < that.len && nextTick(fire);
		} // resolve

		function reject(err, val) {
			if (args) return args[0] ?
				err ? console.log('rejected twice:', err, args[0]) : console.log('resolved after rejected:', val, args[0]) :
				err ? console.log('rejected after resolved:', err, args[1]) : console.log('resolved twice:', val, args[1]);
			args = arguments;
			pos < that.len && nextTick(fire);
		} // reject

		function fire() {
			for (; pos < that.len; ++pos) {
				var cb = that[pos], next = cb.next;
				try {
					var r = cb.apply(null, args);
					if (typeof r === 'function') r(next);
					else if (r && r.then) r.then(function (v) { next(null, v); }, next);
					else if (r instanceof Error) next(r);
					else next(null, r);
				} catch (e) { next(e); }
				that[pos] = undefined;
			}
		} // fire
	} // PromiseLight

	// PromiseLight#then
	PromiseLight.prototype.then = function (resolve, reject) {
		this[this.len++] = cb;
		return new PromiseLight(function (resolve, reject) { cb.next = reject; });

		function cb(err, val) {
			return err ? reject ? reject(err) : err : resolve ? resolve(val) : undefined;
		}
	}; // then

	// PromiseLight#catch
	PromiseLight.prototype['catch'] = function (reject) {
		this[this.len++] = cb;
		return new PromiseLight(function (resolve, reject) { cb.next = reject; });

		function cb(err, val) {
			return err ? reject ? reject(err) : err : undefined;
		}
	}; // catch


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
			}
		} // fire
	} // PromiseThunk

	function re(val) { var x = Math.random(); if (x < 0.2) throw new Error(val + ' ' + x); }

	wait3(100, 111)
	(function (err, val) {

		console.log('==== Thunk', err, val);
		return wait1(100, 100)
		(function (err, val) { console.log('wait1 100:', err, val); if (err) return err; re(val); return wait1(100, 200); })
		(function (err, val) { console.log('wait1 200:', err, val); if (err) return err; re(val); return wait1(100, 300); })
		(function (err, val) { console.log('wait1 300:', err, val); if (err) return err; re(val); return wait1(100, 400); })
		(function (err, val) { console.log('wait1 400:', err, val); if (err) return err; re(val); return wait1(100, 500); })
		(function (err, val) { console.log('wait1 500:', err, val); if (err) return err; re(val); return wait1(100, 600); })
		(function (err, val) { console.log('wait1 600:', err, val); if (err) return err; re(val); return wait1(100, 700); })
		(function (err, val) { console.log('wait1 700:', err, val); if (err) return err; re(val); return wait1(100, 800); })
		(function (err, val) { console.log('wait1 800:', err, val); if (err) return err; re(val); return wait1(100, 900); });

	})
	(function (err, val) {

		console.log('==== Promise', err, val);
		return wait2(100, 100)
		.then(function (val) { console.log('wait2 100 val:', val); re(val); return wait2(100, 200); })
		.then(function (val) { console.log('wait2 200 val:', val); re(val); return wait2(100, 300); })
		.then(function (val) { console.log('wait2 300 val:', val); re(val); return wait2(100, 400); })
		.then(function (val) { console.log('wait2 400 val:', val); re(val); return wait2(100, 500); })
		.then(function (val) { console.log('wait2 500 val:', val); re(val); return wait2(100, 600); })
		.then(function (val) { console.log('wait2 600 val:', val); re(val); return wait2(100, 700); })
		.then(function (val) { console.log('wait2 700 val:', val); re(val); return wait2(100, 800); })
		.catch(function (err) { console.log('wait2 800 err:', err); return err; });

	})
	(function (err, val) {

		console.log('==== Thunk', err, val);
		return wait3(100, 100)
		(function (err, val) { console.log('wait3 100:', err, val); if (err) return err; re(val); return wait3(100, 200); })
		(function (err, val) { console.log('wait3 200:', err, val); if (err) return err; re(val); return wait3(100, 300); })
		(function (err, val) { console.log('wait3 300:', err, val); if (err) return err; re(val); return wait3(100, 400); })
		(function (err, val) { console.log('wait3 400:', err, val); if (err) return err; re(val); return wait3(100, 500); })
		(function (err, val) { console.log('wait3 500:', err, val); if (err) return err; re(val); return wait3(100, 600); })
		(function (err, val) { console.log('wait3 600:', err, val); if (err) return err; re(val); return wait3(100, 700); })
		(function (err, val) { console.log('wait3 700:', err, val); if (err) return err; re(val); return wait3(100, 800); })
		(function (err, val) { console.log('wait3 800:', err, val); if (err) return err; re(val); return wait3(100, 900); });

	})
	(function (err, val) {

		console.log('==== PromiseThunk thunk', err, val);
		return wait4(100, 100)
		(function (err, val) { console.log('wait4 100:', err, val); if (err) return err; re(val); return wait4(100, 200); })
		(function (err, val) { console.log('wait4 200:', err, val); if (err) return err; re(val); return wait4(100, 300); })
		(function (err, val) { console.log('wait4 300:', err, val); if (err) return err; re(val); return wait4(100, 400); })
		(function (err, val) { console.log('wait4 400:', err, val); if (err) return err; re(val); return wait4(100, 500); })
		(function (err, val) { console.log('wait4 500:', err, val); if (err) return err; re(val); return wait4(100, 600); })
		(function (err, val) { console.log('wait4 600:', err, val); if (err) return err; re(val); return wait4(100, 700); })
		(function (err, val) { console.log('wait4 700:', err, val); if (err) return err; re(val); return wait4(100, 800); })
		.then(function (val) { console.log('wait4 800:', val); },
		      function (err) { console.log('wait4 800 err:', err); return err; });

	})
	(function (err, val) {

		console.log('==== PromiseThunk promise', err, val);

		//if (err) return err;

		return wait4(100, 100)
		.then(function (val) { console.log('wait4 100 val:', val); re(val); return wait4(100, 200); })
		.then(function (val) { console.log('wait4 200 val:', val); re(val); return wait4(100, 300); })
		.then(function (val) { console.log('wait4 300 val:', val); re(val); return wait4(100, 400); })
		.then(function (val) { console.log('wait4 400 val:', val); re(val); return wait4(100, 500); })
		.then(function (val) { console.log('wait4 500 val:', val); re(val); return wait4(100, 600); })
		.then(function (val) { console.log('wait4 600 val:', val); re(val); return wait4(100, 700); })
		.then(function (val) { console.log('wait4 700 val:', val); re(val); return wait4(100, 800); })
		.catch(function (err) { console.log('wait4 800 err:', err); return err; });

	})
	(function (err, val) {
		console.log('==== final', err, val);
	});

}();
