(function () {
  'use strict';

  var BlueBird = require('bluebird');
  var Promise3 = require('./promise-light3'); // closure
  var Promise4 = require('./promise-light4'); // normal object

  var N = 1e3, M = 100;

  function bench(Promise, nm) {
    var start = Date.now();
    var arr2 = [];
    var j = 0;
    var dfd = Promise.defer();

    function next() {
      if (++j > M) {
        console.log(nm, ((Date.now() - start) / 1000.0).toFixed(3), 'ms');
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

//    return Promise.all(arr2).then(function () {
//      console.log(nm, ((Date.now() - start) / 1000.0).toFixed(3));
//    });
  }

  bench(Promise3, 'p3').then(function () {
    return bench(Promise4, 'p4');
  }).then(function () {
    return bench(Promise, 'p0');
  }).then(function () {
    return bench(Promise3, 'p3');
  }).then(function () {
    return bench(Promise4, 'p4');
  }).then(function () {
    return bench(Promise, 'p0');
  }).then(function () {
    return bench(Promise3, 'p3');
  }).then(function () {
    return bench(Promise4, 'p4');
  }).then(function () {
    return bench(BlueBird, 'bb');
  }).then(function () {
    return bench(Promise, 'p0');
  });

})();
