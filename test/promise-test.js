(function () {
  'use strict';

  var assert = require('assert');

  var promises = {
    Promise: Promise,
    'light-promise': require('light-promise'),
    bluebird: require('bluebird'),
    'promise-light': require('../lib/promise-light')
  };

  var keys = Object.keys(promises);
  keys.forEach(function (key) {
    var Promise = promises[key];

    // test テスト
    var no = 0;

    // msミリ秒後にこのpromiseを解決する
    function delay(ms, val) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { resolve(val); }, ms);
      });
    } // delay

    // msミリ秒後にこのpromiseを拒否する
    function delayReject(ms, val) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { reject(new Error('err ' + val)); }, ms);
      });
    } // delayReject

    // timer3
    // msミリ秒後にこのpromiseを解決または拒否する
    function timer3(ms) {
      return Math.random() > 0.5 ? timer(ms) : timer2(ms);
    }

    describe('test promise "' + key + '"', function () {

      if (!Promise) return;

      it('Promise.resolve', function () {
        return Promise.resolve('ok').then(
          function (val) { assert(val, 'ok'); });
      }); // it Promise.resolve

      it('Promise.reject', function () {
        return Promise.reject(new Error('ng')).then(null,
          function (err) { assert(err.message, 'ng'); });
      }); // it Promise.reject

      it('Promise.all', function () {
        return Promise.all([delay(10, 10), delay(20, 20), delay(30, 30)])
          .then(function (val) {
            assert.deepEqual(val, [10, 20, 30]);
          }, function (err) {
            assert(false, 'Promise.all fail: ' + err);
          }); // all
      }); // it Promise.all

      it('Promise.all 2', function () {
        return Promise.all([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)])
          .then(function (val) {
            assert.deepEqual(val, [1, 2, 3]);
          }); // all
      }); // it Promise.all 2

      Promise.race &&
      it('Promise.race', function () {
        return Promise.race([delay(10, 10), delay(20, 20), delay(30, 30)])
          .then(function (val) {
            assert(val, 10);
          }, function (err) {
            assert(false, 'Promise.race fail: ' + err);
          }); // race
      }); // it Promise.race

      Promise.race &&
      it('Promise.race 2', function () {
        return Promise.race([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)])
          .then(function (val) {
            assert(val, 1);
          }); // race
      }); // it Promise.race 2

    }); // describe



  }); // keys forEach

})();

/*

  // main メイン
  console.log('start');
  timer3(500).then(function (res) {
    console.log('ok 1st', res);
    return timer3(500);
  }, function (err) {
    console.log('ng 1st', err);
    return 'ng 1st';
  }).then(function (res) {
    console.log('ok 2nd', res);
    return timer3(500);
  }, function (err) {
    console.log('ng 2nd', err);
    return 'ng 2nd';
  }).then(function (res) {
    console.log('ok 3rd', res);
    return timer3(500);
  }, function (err) {
    console.log('ng 3rd', err);
    return 'ng 3rd';
  }).catch(function (err) {
    console.log('ng last', err);
  }).then(function() {
    console.log('final');
  });

*/

/*

  Promise.all([Promise.resolve(11), 22, Promise.resolve(33)])
  .then(function (results) {
      console.log(results);  // [11, 22, 33]
  }); // all

  Promise.race([Promise.resolve(11), 22, Promise.resolve(33)])
  .then(function (results) {
      console.log(results);  // 11
  }); // race

  Promise.all([])
  .then(function (results) {
      console.log('all []', results);  // []
  }, function (error) {
      console.log('all []', error);  // []
  }); // all

  Promise.race([])
  .then(function (results) {
      console.log('race []', results);  // undefined?
  }, function (error) {
      console.log('race []', error);  // undefined?
  }); // race

*/
