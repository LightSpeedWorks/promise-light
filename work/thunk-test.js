// thunk ... chainable thunk

void function () {
	'use strict';

	var slice = [].slice;

	var nextTick = require('./next-tick');
	var Thunk1 = require('./thunk1');
	var Thunk = require('./thunk');
	var PromiseLight = require('./promise-light9');
	var PromiseThunk = require('./promise-thunk9');


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
