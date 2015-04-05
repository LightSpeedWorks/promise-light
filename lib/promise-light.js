(function () {
  'use strict';

  var Base = require('base-class-extend'), extend = Base.extend;

  var UNRESOLVED = 'unresolved',
      RESOLVED = 'resolved',
      REJECTED = 'rejected';

  // nextTick(fn)
  function nextTick(fn) {
    if (process && typeof process.nextTick === 'function')
      process.nextTick(fn);
    else if (typeof setImmediate === 'function')
      setImmediate(fn);
    else
      setTimeout(fn, 0);
  }

  // isPromise
  function isPromise(p) {
    return p && typeof p.then === 'function';
  }

  // setConst(obj, prop, val)
  var setConst = Object.defineProperty ?
    function setConst(obj, prop, val) {
      Object.defineProperty(obj, prop, {value: val}); } :
    function setConst(obj, prop, val) { obj[prop] = val; };

  var Promise = extend(
    {
      // Promise(setup(resolve, reject))
      constructor: function Promise(setup) {
        var state = UNRESOLVED;
        var stack = [];
        var ctx = this;
        var values;

        // fire
        function fire() {
          stack.forEach(function (elem) {
            var fn = elem[state];
            var resolve = elem.resolve;
            var reject  = elem.reject;
            try {
              if (fn) var val = fn.apply(ctx, values);
              if (isPromise(val))
                val.then(function (val) { resolve(val); },
                         function (err) { reject(err);  });
              else resolve(val);
            } catch (err) {
              reject(err);
            }
          });
        } // fire

        // resolve(result)
        var resolve = function resolve() {
          if (state === UNRESOLVED)
            state = RESOLVED, values = arguments, nextTick(fire);
        }.bind(this);

        // reject(error)
        var reject = function reject() {
          if (state === UNRESOLVED)
            state = REJECTED, values = arguments, nextTick(fire);
        }.bind(this);

        var proto = {
          // then(resolve, reject)
          then: function then(res, rej) {
            var resolve, reject;
            var p = new Promise(function (res, rej) { resolve = res; reject = rej; });
            stack.push({resolved:res, rejected:rej, resolve:resolve, reject:reject});
            return p;
          },

          // catch(reject)
          'catch': function caught(reject) {
            return this.then(undefined, reject);
          }
        };

        if (setup && typeof setup === 'function')
          setup.call(this, resolve, reject);
        else { // public promise
          proto.resolve = resolve;
          proto.reject  = reject;
        }

        Base.prototype.addPrototype.call(this, proto);
      },
    },
    // static
    {
      // Promise.resolve(result)
      resolve: function resolve(result) {
        var resolve;
        var p = new Promise(function (res, rej) { resolve = res; });
        resolve(result);
        return p;
      },

      // Promise.reject(error)
      reject: function reject(error) {
        var reject;
        var p = new Promise(function (res, rej) { reject = rej; });
        reject(error);
        return p;
      },

      // Promise.all([p, ...])
      all: function all(promises) {
        var resolve, reject;
        var p = new Promise(function (res, rej) { resolve = res; reject = rej; });
        var n = promises.length;

        if (n === 0)
          return resolve([]), p;

        var res = Array(n);

        promises.forEach(function (p, i) {
          if (isPromise(p))
            p.then(function (r) {
                     res[i] = r;
                     if (--n === 0) resolve(res);
                   },
                   function (e) { reject(e); });
          else
            nextTick(function () {
              res[i] = p;
              if (--n === 0) resolve(res);
            });
        });
        return p;
      },

      // Promise.race([p, ...])
      race: function race(promises) {
        var resolve, reject;
        var p = new Promise(function (res, rej) { resolve = res; reject = rej; });

        promises.forEach(function (p) {
          if (isPromise(p))
            p.then(function (r) { resolve(r); },
                   function (e) { reject(e); });
          else nextTick(function () { resolve(p) });
        });
        return p;
      },
    }
  ); // Promise

  module.exports = exports = Promise;

})();
