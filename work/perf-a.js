(function (PromiseOrg) {
	'use strict';

	console.log(process.version, process.arch);
	var BlueBird = require('bluebird');
	try {
		var BlueBird3 = require('bluebird305');
	} catch (e) {}
	var PromiseLight = require('../promise-light');	// normal object
	var PromiseCore = require('./promise-core');	// normal object and thunk function
	var Promise2 = require('./promise-light2');	// normal object
	var PromiseB = require('./promise-light-b');	// normal object + closure
	var PromiseD = require('./promise-light-d');	// normal object
	var PromiseE = require('./promise-light-e');	// normal object
	var PromiseA = require('./promise-light-a');	// normal object
	var Promise9 = require('./promise-light9');	// normal object + closure
	var Promise8 = require('./promise-light8');	// normal object

	var Promise = (PromiseOrg = PromiseOrg || PromiseB);
	try {
		var PromiseThunk = require('../../promise-thunk/promise-thunk'); // closure function
	} catch (e) {
		console.error(e);
		var PromiseThunk = require('promise-thunk'); // closure function
	}

	var N = 1e3, M = 200;

	function bench(Promise, nm) {
		try {

			if (!Promise) return PromiseOrg.resolve(1);
			var arr2 = [];
			var j = 0;
			var start = Date.now();
			var resolve, reject;
			var promise = new Promise(function (res, rej) { resolve = res; reject = rej; });

			next();

			function next() {
				if (++j > M) {
					process.stdout.write(nm + ': ' + ((Date.now() - start) / 1000.0).toFixed(3) + '   ');
					return resolve();
				}

				new Promise(function (resolve, reject) {
					try {
						var arr = [];

						for (var i = 0; i < N; ++i)
							arr.push(Promise.resolve(1));

						for (var i = 0; i < N; ++i)
							arr.push(new Promise(function (resolve, reject) { resolve(1); }));

						Promise.all(arr).then(function () {
							resolve();
						});
					} catch (e) { console.log(e.stack || e); }

				}).then(next, function (err) { console.log(err); });

			}

			return promise;
		} catch (e) { console.log(e.stack || e); }
	}

	try {

		bench(Promise, 'p0').then(function () {
			return bench(PromiseLight, 'pl');
		}).then(function () {
			return bench(PromiseCore, 'pc');
		}).then(function () {
			return bench(PromiseB, 'pb');
		}).then(function () {
			return bench(PromiseD, 'pd');
		}).then(function () {
			return bench(PromiseE, 'pe');
		}).then(function () {
			return bench(PromiseA, 'pa');
		}).then(function () {
			return bench(Promise9, 'p9');
		}).then(function () {
			return bench(Promise8, 'p8');
		}).then(function () {
			return bench(PromiseThunk, 'pt');
		}).then(function () {
			return bench(BlueBird, 'bb');
		}).then(function () {
			return bench(BlueBird3, 'bb3');
		}).then(function () {
			process.stdout.write('\n');
			return bench(Promise, 'p0');
		}).then(function () {
			return bench(PromiseLight, 'pl');
		}).then(function () {
			return bench(PromiseCore, 'pc');
		}).then(function () {
			return bench(PromiseB, 'pb');
		}).then(function () {
			return bench(PromiseD, 'pd');
		}).then(function () {
			return bench(PromiseE, 'pe');
		}).then(function () {
			return bench(PromiseA, 'pa');
		}).then(function () {
			return bench(Promise9, 'p9');
		}).then(function () {
			return bench(Promise8, 'p8');
		}).then(function () {
			return bench(PromiseThunk, 'pt');
		}).then(function () {
			return bench(BlueBird, 'bb');
		}).then(function () {
			return bench(BlueBird3, 'bb3');
		}).then(function () {
			process.stdout.write('\n');
			return bench(Promise, 'p0');
		}).then(function () {
			return bench(PromiseLight, 'pl');
		}).then(function () {
			return bench(PromiseCore, 'pc');
		}).then(function () {
			return bench(PromiseB, 'pb');
		}).then(function () {
			return bench(PromiseD, 'pd');
		}).then(function () {
			return bench(PromiseE, 'pe');
		}).then(function () {
			return bench(PromiseA, 'pa');
		}).then(function () {
			return bench(Promise9, 'p9');
		}).then(function () {
			return bench(Promise8, 'p8');
		}).then(function () {
			return bench(PromiseThunk, 'pt');
		}).then(function () {
			return bench(BlueBird, 'bb');
		}).then(function () {
			return bench(BlueBird3, 'bb3');
		}).then(function () {
			process.stdout.write('\n');
			return bench(Promise, 'p0');
		}).then(function () {
			return bench(PromiseLight, 'pl');
		}).then(function () {
			return bench(PromiseCore, 'pc');
		}).then(function () {
			return bench(PromiseB, 'pb');
		}).then(function () {
			return bench(PromiseD, 'pd');
		}).then(function () {
			return bench(PromiseE, 'pe');
		}).then(function () {
			return bench(PromiseA, 'pa');
		}).then(function () {
			return bench(Promise9, 'p9');
		}).then(function () {
			return bench(Promise8, 'p8');
		}).then(function () {
			return bench(PromiseThunk, 'pt');
		}).then(function () {
			return bench(BlueBird, 'bb');
		}).then(function () {
			return bench(BlueBird3, 'bb3');
		}).then(function () {
			process.stdout.write('\n');
			return bench(Promise, 'p0');
		}).then(function () {
			return bench(PromiseLight, 'pl');
		}).then(function () {
			return bench(PromiseCore, 'pc');
		}).then(function () {
			return bench(PromiseB, 'pb');
		}).then(function () {
			return bench(PromiseD, 'pd');
		}).then(function () {
			return bench(PromiseE, 'pe');
		}).then(function () {
			return bench(PromiseA, 'pa');
		}).then(function () {
			return bench(Promise9, 'p9');
		}).then(function () {
			return bench(Promise8, 'p8');
		}).then(function () {
			return bench(PromiseThunk, 'pt');
		}).then(function () {
			return bench(BlueBird, 'bb');
		}).then(function () {
			return bench(BlueBird3, 'bb3');
		}).then(function () {
			process.stdout.write('\n');
			return bench(Promise, 'p0');
		}).then(function () {
			return bench(PromiseLight, 'pl');
		}).then(function () {
			return bench(PromiseCore, 'pc');
		}).then(function () {
			return bench(PromiseB, 'pb');
		}).then(function () {
			return bench(PromiseD, 'pd');
		}).then(function () {
			return bench(PromiseE, 'pe');
		}).then(function () {
			return bench(PromiseA, 'pa');
		}).then(function () {
			return bench(Promise9, 'p9');
		}).then(function () {
			return bench(Promise8, 'p8');
		}).then(function () {
			return bench(PromiseThunk, 'pt');
		}).then(function () {
			return bench(BlueBird, 'bb');
		}).then(function () {
			return bench(BlueBird3, 'bb3');
		}).then(function () {
			process.stdout.write('\n');
			return bench(Promise, 'p0');
		}).then(function () {
			return bench(PromiseLight, 'pl');
		}).then(function () {
			return bench(PromiseCore, 'pc');
		}).then(function () {
			return bench(PromiseB, 'pb');
		}).then(function () {
			return bench(PromiseD, 'pd');
		}).then(function () {
			return bench(PromiseE, 'pe');
		}).then(function () {
			return bench(PromiseA, 'pa');
		}).then(function () {
			return bench(Promise9, 'p9');
		}).then(function () {
			return bench(Promise8, 'p8');
		}).then(function () {
			return bench(PromiseThunk, 'pt');
		}).then(function () {
			return bench(BlueBird, 'bb');
		}).then(function () {
			return bench(BlueBird3, 'bb3');
		}).then(function () {
			process.stdout.write('\n');
			return bench(Promise, 'p0');
		}).then(function () {
			return bench(PromiseLight, 'pl');
		}).then(function () {
			return bench(PromiseCore, 'pc');
		}).then(function () {
			return bench(PromiseB, 'pb');
		}).then(function () {
			return bench(PromiseD, 'pd');
		}).then(function () {
			return bench(PromiseE, 'pe');
		}).then(function () {
			return bench(PromiseA, 'pa');
		}).then(function () {
			return bench(Promise9, 'p9');
		}).then(function () {
			return bench(Promise8, 'p8');
		}).then(function () {
			return bench(PromiseThunk, 'pt');
		}).then(function () {
			return bench(BlueBird, 'bb');
		}).then(function () {
			return bench(BlueBird3, 'bb3');
		}).then(function () {
			process.stdout.write('\n');
			return bench(Promise, 'p0');
		}).then(function () {
			return bench(PromiseLight, 'pl');
		}).then(function () {
			return bench(PromiseCore, 'pc');
		}).then(function () {
			return bench(PromiseB, 'pb');
		}).then(function () {
			return bench(PromiseD, 'pd');
		}).then(function () {
			return bench(PromiseE, 'pe');
		}).then(function () {
			return bench(PromiseA, 'pa');
		}).then(function () {
			return bench(Promise9, 'p9');
		}).then(function () {
			return bench(Promise8, 'p8');
		}).then(function () {
			return bench(PromiseThunk, 'pt');
		}).then(function () {
			return bench(BlueBird, 'bb');
		}).then(function () {
			return bench(BlueBird3, 'bb3');
		}).then(function () {
			process.stdout.write('\n');
			return bench(Promise, 'p0');
		}).then(function () {
			return bench(PromiseLight, 'pl');
		}).then(function () {
			return bench(PromiseCore, 'pc');
		}).then(function () {
			return bench(PromiseB, 'pb');
		}).then(function () {
			return bench(PromiseD, 'pd');
		}).then(function () {
			return bench(PromiseE, 'pe');
		}).then(function () {
			return bench(PromiseA, 'pa');
		}).then(function () {
			return bench(Promise9, 'p9');
		}).then(function () {
			return bench(Promise8, 'p8');
		}).then(function () {
			return bench(PromiseThunk, 'pt');
		}).then(function () {
			return bench(BlueBird, 'bb');
		}).then(function () {
			return bench(BlueBird3, 'bb3');
		}).then(function () {
			process.stdout.write('\n');
		});

	} catch (e) { console.log(e.stack || e); }

})(typeof Promise === 'function' ? Promise : null);
