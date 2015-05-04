(function () {
  'use strict';

  var assert = this.assert || require('assert');

  var promises = {
    Promise: /* native*/ typeof Promise === 'function' ? Promise : undefined,
    // 'light-promise': require('light-promise'),
    bluebird: this.bluebird || require('bluebird'),
    'es6-promise': require('es6-promise') && require('es6-promise').Promise,
    'promise-light': this.PromiseLight || require('../lib/promise-light')
  };

  // Object.keys for ie8
  if (!Object.keys)
    Object.keys = function keys(obj) {
      var keys = [];
      for (var i in obj)
        if (obj.hasOwnProperty(i)) keys.push(i);
      return keys;
    };

  // Object.getOwnPropertyNames for ie8
  if (!Object.getOwnPropertyNames)
    Object.getOwnPropertyNames = Object.keys;

  // Array.prototype.forEach for ie8
  if (!Array.prototype.forEach)
    Array.prototype.forEach = function forEach(fn) {
      for (var i = 0, n = this.length; i < n; ++i)
        fn(this[i], i, this);
    };

  // Array.prototype.map for ie8
  if (!Array.prototype.map)
    Array.prototype.map = function map(fn) {
      var arr = [];
      for (var i = 0, n = this.length; i < n; ++i)
        arr.push(fn(this[i], i, this));
      return arr;
    };

  // Array.prototype.filter for ie8
  if (!Array.prototype.filter)
    Array.prototype.filter = function filter(fn) {
      var arr = [];
      for (var i = 0, n = this.length; i < n; ++i)
        if (fn(this[i], i, this))
          arr.push(this[i]);
      return arr;
    };

  var keys = Object.keys(promises);
  keys.forEach(function (key) {
    var Promise = promises[key];
    if (!Promise) return;

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

      if (typeof Promise === 'undefined')
        return it('Promise not implemented');

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
            rej(new Error('ng: unhandled reject'));
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
          function (val) { assert(false, 'ng: ' + val); },
          function (err) { assert.equal(err.message, 'ng'); });
      }); // it Promise setup error

      it('Promise setup unhandled error', function () {
        var called;
        new Promise(function (resolve, reject) {
          throw new Error('ng');
        }).then(function (val) { assert(false, 'ng: ' + val); })
        ['catch'](function (err) { assert.equal(err.message, 'ng'); called = true; } );
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
        return delay(100, 'ok').then(
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
        return delay(100, 'ok').then(
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
      }) // it Promise.accept promise
      || it('Promise.accept not implemented');

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
      }) // it Promise.all []
      || it('Promise.all([]) not implemented');

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
      }) // it Promise.all values
      || it('Promise.all values not implemented');

      Promise.race &&
      it('Promise.race promises', function () {
        return Promise.race([delay(10, 10), delay(20, 20), delay(15, 30)])
          .then(
            function (val) {
              assert.equal(val, 10); },
            function (err) {
              assert(false, 'ng: ' + err); });
      }) // it Promise.race promises
      || it('Promise.race not implemented');

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

      Promise.defer &&
      it('Promise.defer', function () {
        var dfd = Promise.defer();
        setTimeout(function () { dfd.resolve('ok'); }, 10);
        return dfd.promise.then(
          function (val) {
            assert.equal(val, 'ok', 'Promise defer not ok'); },
          function (err) {
            assert(false, 'ng: ' + err); });
      }) // it Promise.defer
      || it('Promise.defer not implemented');

      Promise.defer &&
      it('Promise.defer promise constructor is Promise', function () {
        var dfd = Promise.defer();
        dfd.resolve();
        assert.equal(dfd.promise.constructor, Promise);
      }); // it Promise.defer

      Promise.defer &&
      function () {
        var dfd = Promise.defer();
        dfd.resolve();
        return dfd.constructor === Object;
      } () &&
      it('Promise.defer constructor is Object', function () {
        var dfd = Promise.defer();
        dfd.resolve();
        assert.equal(dfd.constructor, Object);
      }) // it Promise.defer constructor is Object
      || it('Promise.defer constructor is not Object');

      Promise.defer &&
      function () {
        var dfd = Promise.defer();
        var res = dfd.resolve;
        try { res(); return true; }
        catch (e) { return false; }
      } () &&
      it('Promise.defer without context', function () {
        var dfd = Promise.defer();
        setTimeout(function () {
            var res = dfd.resolve;
            try { res('ok'); }
            catch (e) {
              dfd.reject(e);
            }
          }, 10);
        return dfd.promise.then(
          function (val) {
            assert.equal(val, 'ok'); },
          function (err) {
            assert(false, 'ng: ' + err); });
      }) // it Promise.defer without context
      || it('Promise.defer without conext not implemented');

      key !== 'bluebird' &&
      it('Promise keys match', function () {
        var keys = Object.keys(Promise).sort().join(',');
        assert(keys === 'all,race,reject,resolve' ||
               keys === 'accept,all,defer,race,reject,resolve' ||
               keys === '', 'Promise keys not match: keys = ' + keys);
      }) // it Promise keys
      || it('Promise keys not match');

      key !== 'bluebird' &&
      it('Promise own property names match', function () {
        function f(x) {
          return x !== 'arguments'  && x !== 'caller' &&
                 x !== 'length'     && x !== 'name'   &&
                 x !== 'prototype'  && x !== 'toString';
        }
        var keys = Object.getOwnPropertyNames(Promise).filter(f).sort().join(',');
        assert(keys === 'accept,all,defer,race,reject,resolve' ||
               keys === 'all,race,reject,resolve',
               'Promise own property names match: keys = ' + keys);
      }) // it Promise own property names
      || it('Promise own property names not match');

      typeof Symbol === 'function' && Symbol && Symbol.iterator &&
      it('ES6 iterator', function () {
        var a = {}, b = {};
        a[Symbol.iterator] = iterator;
        b[Symbol.iterator] = iterator;
        Promise.all(a).then(
          function (values) { assert.deepEqual(values, [20, 40, 60]); },
          function (error) { assert(false, 'Error: ' + error); });
        Promise.race(b).then(
          function (values) { assert.deepEqual(values, 20); },
          function (error) { assert(false, 'Error: ' + error); });

        function iterator() {
          var i = 0;
          var iter = {
            next: function () {
              i += 20;
              return i <= 60 ? {value: i} : {done: true};
            }
          };
          return iter;
        }
      }); // it ES6 iterator

      it('iterator values', function () {
        Promise.all(iterator()).then(
          function (values) { assert.deepEqual(values, [20, 40, 60]); },
          function (error) { assert(false, 'Error: ' + error); });
        Promise.race(iterator()).then(
          function (values) { assert.deepEqual(values, 20); },
          function (error) { assert(false, 'Error: ' + error); });

        function iterator() {
          var i = 0;
          var iter = {
            next: function () {
              i += 20;
              return i <= 60 ? {value: i} : {done: true};
            }
          };
          if (typeof Symbol === 'function' && Symbol && Symbol.iterator)
            iter[Symbol.iterator] = iterator;
          return iter;
        }
      }); // it iterator

      it('iterator promises', function () {
        Promise.all(iterator()).then(
          function (values) { assert.deepEqual(values, [20, 40, 60]); },
          function (error) { assert(false, 'Error: ' + error); });
        Promise.race(iterator()).then(
          function (values) { assert.deepEqual(values, 20); },
          function (error) { assert(false, 'Error: ' + error); });

        function iterator() {
          var i = 0;
          var iter = {
            next: function () {
              i += 20;
              return i <= 60 ? {value: delay(i, i)} : {done: true};
            }
          };
          if (typeof Symbol === 'function' && Symbol && Symbol.iterator)
            iter[Symbol.iterator] = iterator;
          return iter;
        }
      }); // it iterator

    }); // describe


  }); // keys forEach

}).call(this);

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
