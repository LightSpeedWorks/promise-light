(function () {
  'use strict';

  var Base = require('base-class-extend'), extend = Base.extend;

  var UNRESOLVED = 'unresolved',
      RESOLVED = 'resolved',
      REJECTED = 'rejected';

  // nextTick(fn)
  var nextTick = typeof setImmediate === 'function' ? setImmediate :
    process && typeof process.nextTick === 'function' ? process.nextTick :
    function nextTick(fn) { setTimeout(fn, 0); };

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
        var args;
        var rejectCalled;

        // fire
        function fire() {
          var elem;
          while (elem = stack.shift()) {
            var fn = elem[state];
            try {
              if (fn) {
                if (state === REJECTED)
                  rejectCalled = true;
                var val = fn.apply(ctx, args);
              }
              // unhandled rejection fall thru
              else if (state === REJECTED) {
                rejectCalled = true;
                elem.reject.apply(ctx, args);
                continue;
              }
              if (isPromise(val))
                val.then(function (val) { elem.resolve(val); },
                         function (err) { elem.reject(err);  });
              else elem.resolve(val);
            } catch (err) {
              elem.reject(err);
            }
          } // while elem = stack.shift()
        } // fire

        // resolve(value)
        var resolve = function resolve() {
          if (state === UNRESOLVED)
            state = RESOLVED, args = arguments, nextTick(fire);
        }.bind(this);

        // reject(error)
        var reject = function reject() {
          if (state === UNRESOLVED)
            state = REJECTED, args = arguments, nextTick(fire);
        }.bind(this);

        var proto = {
          // then(resolved, rejected)
          then: function then(resolved, rejected) {
            return new Promise(function (resolve, reject) {
              stack.push({resolved:resolved, rejected:rejected,
                          resolve:resolve, reject:reject});
              if (state !== UNRESOLVED) nextTick(fire);
            });
          }, // then

          // catch(rejected)
          'catch': function caught(rejected) {
            return new Promise(function (resolve, reject) {
              stack.push({resolved:undefined, rejected:rejected,
                          resolve:resolve, reject:reject});
              if (state !== UNRESOLVED) nextTick(fire);
            });
          } // catch
        }; // proto

        if (setup && typeof setup === 'function') {
          try {
            setup.call(this, resolve, reject);
          } catch (err) {
            reject(err);
          }
        }
        else {
          // no setup, public promise
          proto.resolve = resolve;
          proto.reject  = reject;
        }

        // Base.prototype.addPrototype.call(this, proto);
        this.addPrototype(proto);

        nextTick(checkUnhandledRejection);

        // checkUnhandledRejection
        function checkUnhandledRejection() {
          if (state === REJECTED && !rejectCalled) {
            console.log('\x1b[35mUnhandled rejection '+ args[0].stack + '\x1b[m');
            // or throw args[0];
            // or process.emit...
          }
        } // checkUnhandledRejection

      },
    },
    // static
    {
      // Promise.resolve(val)
      resolve: function resolve(val) {
        return new Promise(function (resolve, reject) { resolve(val); });
      }, // resolve

      // Promise.reject(err)
      reject: function reject(err) {
        return new Promise(function (resolve, reject) { reject(err); });
      }, // reject

      // Promise.all([p, ...])
      all: function all(promises) {
        // TODO: promises check type and so on
        return new Promise(function (resolve, reject) {
          var n = promises.length;
          if (n === 0) return resolve([]);
          var res = Array(n);
          promises.forEach(function (p, i) {
            if (isPromise(p))
              p.then(
                function (val) {
                  res[i] = val;
                  if (--n === 0) resolve(res);
                },
                function (err) { reject(err); });
            else {
              res[i] = p;
              if (--n === 0) resolve(res);
            }
          }); // promises.forEach
        }); // return new Promise
      }, // all

      // Promise.race([p, ...])
      race: function race(promises) {
        // TODO: promises check type and so on
        return new Promise(function (resolve, reject) {
          promises.forEach(function (p) {
            if (isPromise(p))
              p.then(function (val) { resolve(val); },
                     function (err) { reject(err); });
            else resolve(p);
          }); // promises.forEach
        }); // return new Promise
      }, // race
    }
  ); // Promise

  module.exports = exports = Promise;

})();
