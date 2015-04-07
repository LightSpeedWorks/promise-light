(function () {
  'use strict';

  var assert = require('assert');

  var promises = {
    Promise: /* native*/ Promise,
    // 'light-promise': require('light-promise'),
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

      it('Promise setup sequence', function () {
        var seq = 0;
        assert.equal(++seq, 1);
        // Promise setup called synchronously
        // Promise setup は同期的に呼ばれる
        var p = new Promise(function (resolve, reject) {
          assert.equal(++seq, 2);
          resolve(123);
          assert.equal(++seq, 3);
        });
        p.then(
          function (val) {
            assert.equal(val, 123);
            assert.equal(++seq, 5); },
          function (err) {
            assert(false, 'ng: ' + err); });
        assert.equal(++seq, 4);
        return p;
      }); // it Promise setup sequence

      it('Promise setup unhandled resolve', function () {
        return new Promise(function (resolve, reject) {
          new Promise(function (res, rej) {
            res(123);
            resolve('ok');
          });
        });
      }); // it Promise setup unhandled resolve

      it('Promise setup unhandled reject', function () {
        return new Promise(function (resolve, reject) {
          new Promise(function (res, rej) {
            rej(new Error('ng'));
            resolve('ok');
          });
        });
      }); // it Promise setup unhandled reject

      it('Promise setup resolve then twice', function () {
        var p = new Promise(function (resolve, reject) {
          resolve(123);
        });
        p.then(
          function (val) {
            assert.equal(val, 123); },
          function (err) {
            assert(false, 'ng: ' + err); });
        p.then(
          function (val) {
            assert.equal(val, 123); },
          function (err) {
            assert(false, 'ng: ' + err); });
        return p;
      }); // it Promise setup resolve then twice

      it('Promise setup resolve twice', function () {
        return new Promise(function (resolve, reject) {
          resolve(123);
          resolve(456);
        }).then(
          function (val) {
            assert.equal(val, 123); },
          function (err) {
            assert(false, 'ng: ' + err); });
      }); // it Promise setup resolve twice

      it('Promise setup resolve and reject', function () {
        return new Promise(function (resolve, reject) {
          resolve(123);
          reject(new Error('ng'));
        }).then(
          function (val) {
            assert.equal(val, 123); },
          function (err) {
            assert(false, 'ng: ' + err); });
      }); // it Promise setup resolve and reject

      it('Promise setup reject and resolve', function () {
        return new Promise(function (resolve, reject) {
          reject(new Error('ng'));
          resolve(123);
        }).then(
          function (val) {
            assert(false, 'ng: ' + val); },
          function (err) {
            assert.equal(err.message, 'ng'); });
      }); // it Promise setup reject and resolve

      it('Promise setup reject twice', function () {
        return new Promise(function (resolve, reject) {
          reject(new Error('ng'));
          reject(new Error('ng2'));
        }).then(
          function (val) {
            assert(false, 'ng: ' + err); },
          function (err) {
            assert.equal(err.message, 'ng'); });
      }); // it Promise setup resolve twice

      it('Promise setup error', function () {
        return new Promise(function (resolve, reject) {
          throw new Error('ng');
        }).then(
          function (val) {
            assert(false, 'ng: ' + val); },
          function (err) {
            assert.equal(err.message, 'ng'); });
      }); // it Promise setup error

      it('Promise setup unhandled error', function () {
        var called;
        new Promise(function (resolve, reject) {
          throw new Error('ng');
        }).then(function (val) { assert(false, 'ng: ' + val); })
        .catch(function (err) { assert.equal(err.message, 'ng'); called = true; } );
        return delay(10, 'ok').then(
          function (val) {
            assert(called, 'called?'); });
      }); // it Promise setup unhandled error

      it('Promise setup resolve delayed then once', function () {
        var p = new Promise(function (resolve, reject) {
          resolve(123);
        });
        var called;
        delay(10, 'ok').then(
          function (val) {
            p.then(
              function (val) {
                called = true;
                assert.equal(val, 123); },
              function (err) {
                assert(false, 'ng: ' + err); }); },
            function (err) {
              assert(false, 'ng: ' + err); });
        return delay(20, 'ok').then(
          function (val) {
            assert(called, 'called?'); });
      }); // it Promise setup resolve delayed then once

      it('Promise setup resolve delayed then twice', function () {
        var p = new Promise(function (resolve, reject) {
          resolve(456);
        });
        p.then(
          function (val) {
            assert.equal(val, 456); },
          function (err) {
            assert(false, 'ng: ' + err); });
        var called;
        delay(10, 'ok').then(
          function (val) {
            assert.equal(val, 'ok');
            p.then(
              function (val) {
                called = true;
                assert.equal(val, 456); },
              function (err) {
                assert(false, 'ng: ' + err); }); },
            function (err) {
              assert(false, 'ng: ' + err); });
        return delay(20, 'ok').then(
          function (val) {
            assert(called, 'called?'); });
      }); // it Promise setup resolve delayed then twice

      it('Promise.resolve number', function () {
        return Promise.resolve(123).then(
          function (val) {
            assert.equal(val, 123); },
          function (err) {
            assert(false, 'ng: ' + err); });
      }); // it Promise.resolve number

      it('Promise.resolve string', function () {
        return Promise.resolve('ok').then(
          function (val) {
            assert.equal(val, 'ok'); },
          function (err) {
            assert(false, 'ng: ' + err); });
      }); // it Promise.resolve string

      it('Promise.resolve promise', function () {
        return Promise.resolve(delay(10, 'ok')).then(
          function (val) {
            assert.equal(val, 'ok'); },
          function (err) {
            assert(false, 'ng: ' + err); });
      }); // it Promise.resolve promise

      Promise.accept &&
      it('Promise.accept promise', function () {
        return Promise.accept(delay(10, 'ok')).then(
          function (val) {
            assert.equal(val, 'ok'); },
          function (err) {
            assert(false, 'ng: ' + err); });
      }); // it Promise.accept promise

      it('Promise.reject error', function () {
        return Promise.reject(new Error('ng')).then(
          function (val) {
            assert(false, 'ng: ' + val); },
          function (err) {
            assert.equal(err.message, 'ng'); });
      }); // it Promise.reject error

      it('Promise.reject non-error', function () {
        return Promise.reject('ng').then(
          function (val) {
            assert(false, 'ng: ' + val); },
          function (err) {
            assert.equal(err, 'ng'); });
      }); // it Promise.reject non-error

      it('Promise.all promises', function () {
        return Promise.all([delay(10, 10), delay(20, 20), delay(30, 30)])
          .then(
            function (val) {
              assert.deepEqual(val, [10, 20, 30]); },
            function (err) {
              assert(false, 'ng: ' + err); });
      }); // it Promise.all promises

      key !== 'light-promise' &&
      it('Promise.all []', function () {
        return Promise.all([])
          .then(
            function (val) {
              assert.deepEqual(val, []); },
            function (err) {
              assert(false, 'ng: ' + err); });
      }); // it Promise.all []

      it('Promise.all resolves', function () {
        return Promise.all([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)])
          .then(
            function (val) {
              assert.deepEqual(val, [1, 2, 3]); },
            function (err) {
              assert(false, 'ng: ' + err); });
      }); // it Promise.all resolves

      key !== 'light-promise' &&
      it('Promise.all values', function () {
        return Promise.all([1, 2, 3])
          .then(
            function (val) {
              assert.deepEqual(val, [1, 2, 3]); },
            function (err) {
              assert(false, 'ng: ' + err); });
      }); // it Promise.all values

      Promise.race &&
      it('Promise.race promises', function () {
        return Promise.race([delay(10, 10), delay(20, 20), delay(15, 30)])
          .then(
            function (val) {
              assert.equal(val, 10); },
            function (err) {
              assert(false, 'ng: ' + err); });
      }); // it Promise.race promises

      Promise.race &&
      it('Promise.race resolves', function () {
        return Promise.race([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)])
          .then(
            function (val) {
              assert.equal(val, 1); },
            function (err) {
              assert(false, 'ng: ' + err); });
      }); // it Promise.race resolves

      Promise.race &&
      it('Promise.race values', function () {
        return Promise.race([1, 2, 3]).then(
          function (val) {
            assert.equal(val, 1); },
          function (err) {
            assert(false, 'ng: ' + err); });
      }); // it Promise.race values

      Promise.race &&
      it('Promise.race []', function () {
        return Promise.race([
          Promise.race([]).then(
            function (val) {
              assert(false, 'ng: ' + val); },
            function (err) {
              assert(false, 'ng: ' + err); }),
          delay(20, 123)]).then(
            function (val) {
              assert.equal(val, 123); },
            function (err) {
              assert(false, 'ng: ' + err); });
      }); // it Promise.race []

      it('promise sequence', function () {
        var seq = 0;
        assert.equal(++seq, 1);
        Promise.resolve(1).then(
          function (val) { assert.equal(val, 1); assert.equal(++seq, 4); },
          function (err) { assert(false, 'ng: ' + err); ++seq; });
        assert.equal(++seq, 2);
        Promise.reject('ng').then(
          function (val) { assert.equal(val, 1); ++seq; },
          function (err) { assert.equal(err, 'ng');  assert.equal(++seq, 5); });
        assert.equal(++seq, 3);
        return Promise.all([Promise.resolve(1)])
          .then(
            function (val) { assert.equal(++seq, 6); },
            function (err) { assert(false, 'ng: ' + err); ++seq; });
      }); // it promise sequence

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
