(function (Promise) {
	'use strict';

	console.log(process.version, process.arch);
	var BlueBird = require('bluebird');
	try {
		var BlueBird3 = require('bluebird305');
	} catch (e) {}
	var PromiseLight = require('../promise-light');	// normal object
	Promise = PromiseLight
	var PromiseCore = require('./promise-core');	// normal object and thunk function
	var Promise2 = require('./promise-light2');	// normal object
	var Promise3 = require('./promise-light3');	// closure
	var Promise4 = require('./promise-light4');	// normal object
	var Promise6 = require('./mini-promise');	// normal object
	var Promise7 = require('./promise-light7');	// normal object + closure
	var Promise8 = require('./promise-light8');	// normal object
	try {
		var PromiseThunk = require('../../promise-thunk/promise-thunk'); // closure function
	} catch (e) {
		console.error(e);
		var PromiseThunk = require('promise-thunk'); // closure function
	}

	// native Promise is null then use PromiseLight
	if (!Promise) Promise = PromiseLight;

	var N = 1e3, M = 200;

	function bench(Promise, nm) {
		if (!Promise) return PromiseLight.resolve(1);
		var arr2 = [];
		var j = 0;
		var start = Date.now();
		var resolve, reject;
		var promise = new Promise(function (res, rej) { resolve = res; reject = rej; });
		//try {
		//	var dfd = Promise.defer();
		//	if (typeof dfd.resolve !== 'function') throw new Error('Promise.defer() dfd.resolve?');
		//	if (typeof dfd.reject  !== 'function') throw new Error('Promise.defer() dfd.reject?');
		//} catch (e) { return console.log('Promise ' + nm + '? ' + e), PromiseLight.resolve(1); }

		next();

		function next() {
			if (++j > M) {
				process.stdout.write(nm + ': ' + ((Date.now() - start) / 1000.0).toFixed(3) + '   ');
				return resolve(); // dfd.resolve()
			}

			new Promise(function (res, rej) {
				var arr = [];

				for (var i = 0; i < N; ++i)
					arr.push(Promise.resolve(1));

				Promise.all(arr).then(function () {
					res();
				});
			}).then(next, function (err) { console.log(err); });
		}

		return promise; // dfd.promise
	}

	bench(Promise, 'p0').then(function () {
		return bench(PromiseLight, 'pl');
	}).then(function () {
		return bench(PromiseCore, 'pc');
	}).then(function () {
		return bench(Promise3, 'p3');
	}).then(function () {
		return bench(Promise4, 'p4');
	}).then(function () {
		return bench(Promise6, 'p6');
	}).then(function () {
		return bench(Promise7, 'p7');
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
		return bench(Promise3, 'p3');
	}).then(function () {
		return bench(Promise4, 'p4');
	}).then(function () {
		return bench(Promise6, 'p6');
	}).then(function () {
		return bench(Promise7, 'p7');
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
		return bench(Promise3, 'p3');
	}).then(function () {
		return bench(Promise4, 'p4');
	}).then(function () {
		return bench(Promise6, 'p6');
	}).then(function () {
		return bench(Promise7, 'p7');
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
		return bench(Promise3, 'p3');
	}).then(function () {
		return bench(Promise4, 'p4');
	}).then(function () {
		return bench(Promise6, 'p6');
	}).then(function () {
		return bench(Promise7, 'p7');
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
		return bench(Promise3, 'p3');
	}).then(function () {
		return bench(Promise4, 'p4');
	}).then(function () {
		return bench(Promise6, 'p6');
	}).then(function () {
		return bench(Promise7, 'p7');
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

})(typeof Promise === 'function' ? Promise : null);
