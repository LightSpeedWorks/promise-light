// promise-light.js

this.PromiseLight = function () {
  'use strict';

  var UNRESOLVED = 'unresolved',
      RESOLVED = 'resolved',
      REJECTED = 'rejected';

  var COLOR_ERROR  = typeof window !== 'undefined' ? '' : '\x1b[35m';
  var COLOR_NORMAL = typeof window !== 'undefined' ? '' : '\x1b[m';

  // Function.prototype.bind for ie8
  var slice = Array.prototype.slice;
  if (!Function.prototype.bind)
    Function.prototype.bind = function bind(ctx) {
      var args = slice.call(arguments, 1);
      var fn = this;
      return function () {
        return fn.apply(ctx, slice.call(args).concat(slice.call(arguments)));
      };
    };

  // Queue
  function Queue() {
    this.tail = this.head = null;
  }
  Queue.prototype.push = function push(x) {
    if (this.tal)
      this.tail = this.tail[1] = [x, null];
    else
      this.tail = this.head = [x, null];
  };
  Queue.prototype.shift = function shift() {
    if (!this.head) return null;
    var x = this.head[0];
    this.head = this.head[1];
    if (!this.head) this.tail = null;
    return x;
  };

  var queue = new Queue();

  // nextTick(fn)
  var nextTick =
    typeof process === 'object' && process && typeof process.nextTick === 'function' ? process.nextTick :
    typeof setImmediate === 'function' ? setImmediate :
    function nextTick(fn) { setTimeout(fn, 0); };

  // isPromise
  function isPromise(p) {
    return p instanceof Promise || p && typeof p.then === 'function';
  }

  // isIterator(iter)
  function isIterator(iter) {
    return iter && (typeof iter.next === 'function' || isIterable(iter));
  }

  // isIterable(iter)
  function isIterable(iter) {
    return iter && typeof Symbol === 'function' && Symbol &&
           Symbol.iterator && typeof iter[Symbol.iterator] === 'function';
  }

  // makeArrayFromIterator(iter or array)
  function makeArrayFromIterator(iter) {
    if (iter instanceof Array) return iter;
    if (!isIterator(iter)) return [iter];
    if (isIterable(iter)) iter = iter[Symbol.iterator]();
    var array = [];
    try {
      for (;;) {
        var val = iter.next();
        if (val && val.hasOwnProperty('done') && val.done) return array;
        if (val && val.hasOwnProperty('value')) val = val.value;
        array.push(val);
      }
    } catch (error) {
      return array;
    }
  }

  // defProp
  var defProp = function (obj) {
    if (!Object.defineProperty) return null;
    try {
      Object.defineProperty(obj, 'prop', {value: 'str'});
      return obj.prop === 'str' ? Object.defineProperty : null;
    } catch (err) { return null; }
  } ({});

  // setConst(obj, prop, val)
  var setConst = defProp ?
    function setConst(obj, prop, val) {
      defProp(obj, prop, {value: val}); } :
    function setConst(obj, prop, val) { obj[prop] = val; };

  // setValue(obj, prop, val)
  var setValue = defProp ?
    function setValue(obj, prop, val) {
      defProp(obj, prop, {value: val,
        writable: true, configurable: true}); } :
    function setValue(obj, prop, val) { obj[prop] = val; };

  function PROMISE_RESOLVE() {}
  function PROMISE_REJECT() {}
  function PROMISE_THEN() {}

  // Promise(setup(resolve, reject))
  function Promise(setup) {
    var $result;
    var $ctx = this;
    var $queue = [];
    var $handled = false;
    var $state = UNRESOLVED;

    if (setup === PROMISE_RESOLVE) {
      $state = RESOLVED;
      $result = arguments[1];
    }
    else if (setup === PROMISE_REJECT) {
      $state = REJECTED;
      $result = arguments[1];
    }
    else {
      // resolve(val)
      function resolve(val) {
        if ($state === UNRESOLVED)
          $state = RESOLVED, $result = val, nextTick($fire);
      }

      // reject(err)
      function reject(err) {
        if ($state === UNRESOLVED)
          $state = REJECTED, $result = err, nextTick($fire);
      }

      if (setup === PROMISE_THEN) {
        arguments[3].push({resolved:arguments[1], rejected:arguments[2],
                           resolve: resolve,      reject:  reject});
        if (arguments[4] !== UNRESOLVED) nextTick(arguments[5]);
      }
      else if (setup && typeof setup === 'function') {
        try {
          setup.call(this, resolve, reject);
        } catch (err) {
          reject(err);
        }
      }
      else {
        // no setup, public promise
        setConst(this, 'resolve', resolve);
        setConst(this, 'reject',  reject);
      }

    }

    // then(resolved, rejected)
    setConst(this, 'then', function then(resolved, rejected) {
      if (resolved != null && typeof resolved !== 'function')
        throw new TypeError('resolved must be a function');
      if (rejected != null && typeof rejected !== 'function')
        throw new TypeError('rejected must be a function');
      return new Promise(PROMISE_THEN, resolved, rejected, $queue, $state, $fire);
//      return new Promise(function (resolve, reject) {
//        $queue.push({resolved:resolved, rejected:rejected,
//                     resolve: resolve,  reject:  reject});
//        if ($state !== UNRESOLVED) nextTick($fire);
//      });
    }); // then

    // catch(rejected)
    setConst(this, 'catch', function caught(rejected) {
      if (rejected != null && typeof rejected !== 'function')
        throw new TypeError('rejected must be a function');
      return new Promise(PROMISE_THEN, undefined, rejected, $queue, $state, $fire);
//      return new Promise(function (resolve, reject) {
//        $queue.push({resolved:undefined, rejected:rejected,
//                     resolve: resolve,   reject:  reject});
//        if ($state !== UNRESOLVED) nextTick($fire);
//      });
    }); // catch

    // $fire
    function $fire() {
      var elem;
      while (elem = $queue.shift()) {
        (function (elem) {
          $handled = true;
          var resolve = elem.resolve, reject = elem.reject;
          var completed = elem[$state];
          function complete(val) {
            resolve(completed.call($ctx, val)); }
          try {
            if ($state === RESOLVED) {
              if (!completed) return resolve($result);
              if (isPromise($result))
                return $result.then(complete, reject);
            }
            else { // $state === REJECTED
              if (!completed) return reject($result);
            }
            complete($result);
          } catch (err) {
            reject(err);
          }
        })(elem);
      } // while $queue.shift()
      nextTick($checkUnhandledRejection);
    } // $fire

    // $checkUnhandledRejection
    function $checkUnhandledRejection() {
      if ($state === REJECTED && !$handled) {
        console.error(COLOR_ERROR + 'Unhandled rejection ' +
            ($result instanceof Error ? $result.stack || $result : $result) +
            COLOR_NORMAL);
        // or throw $result;
        // or process.emit...
      }
    } // $checkUnhandledRejection

  } // Promise


  // Promise.resolve(val)
  setValue(Promise, 'resolve', function resolve(val) {
    return new Promise(PROMISE_RESOLVE, val);
//    return new Promise(
//      function promiseResolve(resolve, reject) {
//        resolve(val); });
  }); // resolve

  // Promise.reject(err)
  setValue(Promise, 'reject', function reject(err) {
    return new Promise(PROMISE_REJECT, err);
//    return new Promise(
//      function promiseReject(resolve, reject) {
//        reject(err); });
  }); // reject

  // Promise.all([p, ...])
  setValue(Promise, 'all', function all(promises) {
    if (isIterator(promises)) promises = makeArrayFromIterator(promises);
    if (!(promises instanceof Array))
      throw new TypeError('promises must be an array');
    return new Promise(
      function promiseAll(resolve, reject) {
        var n = promises.length;
        if (n === 0) return resolve([]);
        var res = Array(n);
        promises.forEach(function (p, i) {
          function complete(val) {
            res[i] = val; if (--n === 0) resolve(res); }
          if (p instanceof Promise || isPromise(p))
            return p.then(complete, reject);
          complete(p);
        }); // promises.forEach
      }
    ); // return new Promise
  }); // all

  // Promise.race([p, ...])
  setValue(Promise, 'race', function race(promises) {
    if (isIterator(promises)) promises = makeArrayFromIterator(promises);
    if (!(promises instanceof Array))
      throw new TypeError('promises must be an array');
    return new Promise(
      function promiseRace(resolve, reject) {
        promises.forEach(function (p) {
          if (p instanceof Promise || isPromise(p))
            return p.then(resolve, reject);
          resolve(p);
        }); // promises.forEach
      }
    ); // return new Promise
  }); // race

  // Promise.accept(val)
  setValue(Promise, 'accept', Promise.resolve);

  // Promise.defer()
  setValue(Promise, 'defer', function defer() {
//    var resolve, reject;
    var p = new Promise();
    return {promise: p, resolve: p.resolve, reject: p.reject};
//    var p = new Promise(function (res, rej) {
//      resolve = res;
//      reject = rej;
//    });
    return {promise: p, resolve: resolve, reject: reject};
  });

  if (typeof module === 'object' && module.exports)
    module.exports = Promise;

  return Promise;

}();

this.Promise = typeof Promise === 'function' ? Promise : this.PromiseLight;