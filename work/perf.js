(function (Promise) {
  'use strict';

  console.log(process.version, process.arch);
  var BlueBird = require('bluebird');
  var Promise1 = require('../promise-light'); // closure
  var Promise2 = require('./promise-light2'); // normal object
  var Promise3 = require('./promise-light3'); // closure
  var Promise4 = require('./promise-light4'); // normal object
  var Promise5 = require('./promise-light5'); // closure
  var Promise6 = require('./promise-light6'); // normal object
  try {
    var PromiseThunk = require('../../promise-thunk/promise-thunk'); // closure function
  } catch (e) {
    throw e;
    var PromiseThunk = require('promise-thunk'); // closure function
  }

  if (!Promise) Promise = Promise1;

  var N = 1e3, M = 100;

  function bench(Promise, nm) {
    var start = Date.now();
    var arr2 = [];
    var j = 0;
    var dfd = Promise.defer();

    function next() {
      if (++j > M) {
        process.stdout.write(nm + ': ' + ((Date.now() - start) / 1000.0).toFixed(3) + '\t');
        return dfd.resolve();
      }

      new Promise(function (res, rej) {
        var arr = [];

        for (var i = 0; i < N; ++i)
          arr.push(Promise.resolve(1));

        Promise.all(arr).then(function () {
          res();
        });
      }).then(next);
    }
    next();

    return dfd.promise;
  }

  bench(Promise, 'p0').then(function () {
    return bench(Promise1, 'p1');
  }).then(function () {
//    return bench(Promise2, 'p2');
//  }).then(function () {
    return bench(Promise3, 'p3');
  }).then(function () {
    return bench(Promise4, 'p4');
  }).then(function () {
    return bench(Promise5, 'p5');
  }).then(function () {
    return bench(Promise6, 'p6');
  }).then(function () {
    return bench(PromiseThunk, 'aa');
  }).then(function () {
    return bench(BlueBird, 'bb');
  }).then(function () {
    process.stdout.write('\n');
    return bench(Promise, 'p0');
  }).then(function () {
    return bench(Promise1, 'p1');
  }).then(function () {
//    return bench(Promise2, 'p2');
//  }).then(function () {
    return bench(Promise3, 'p3');
  }).then(function () {
    return bench(Promise4, 'p4');
  }).then(function () {
    return bench(Promise5, 'p5');
  }).then(function () {
    return bench(Promise6, 'p6');
  }).then(function () {
    return bench(PromiseThunk, 'aa');
  }).then(function () {
    return bench(BlueBird, 'bb');
  }).then(function () {
    process.stdout.write('\n');
    return bench(Promise, 'p0');
  }).then(function () {
    return bench(Promise1, 'p1');
  }).then(function () {
//    return bench(Promise2, 'p2');
//  }).then(function () {
    return bench(Promise3, 'p3');
  }).then(function () {
    return bench(Promise4, 'p4');
  }).then(function () {
    return bench(Promise5, 'p5');
  }).then(function () {
    return bench(Promise6, 'p6');
  }).then(function () {
    return bench(PromiseThunk, 'aa');
  }).then(function () {
    return bench(BlueBird, 'bb');
  }).then(function () {
    process.stdout.write('\n');
    return bench(Promise, 'p0');
  }).then(function () {
    return bench(Promise1, 'p1');
  }).then(function () {
//    return bench(Promise2, 'p2');
//  }).then(function () {
    return bench(Promise3, 'p3');
  }).then(function () {
    return bench(Promise4, 'p4');
  }).then(function () {
    return bench(Promise5, 'p5');
  }).then(function () {
    return bench(Promise6, 'p6');
  }).then(function () {
    return bench(PromiseThunk, 'aa');
  }).then(function () {
    return bench(BlueBird, 'bb');
  }).then(function () {
    process.stdout.write('\n');
    return bench(Promise, 'p0');
  }).then(function () {
    return bench(Promise1, 'p1');
  }).then(function () {
//    return bench(Promise2, 'p2');
//  }).then(function () {
    return bench(Promise3, 'p3');
  }).then(function () {
    return bench(Promise4, 'p4');
  }).then(function () {
    return bench(Promise5, 'p5');
  }).then(function () {
    return bench(Promise6, 'p6');
  }).then(function () {
    return bench(PromiseThunk, 'aa');
  }).then(function () {
    return bench(BlueBird, 'bb');
  }).then(function () {
    process.stdout.write('\n');
  });

})(typeof Promise === 'function' ? Promise : null);
