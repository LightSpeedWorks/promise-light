// promise-thunk.js

this.PromiseThunk = function () {
  'use strict';

  var STATE_UNRESOLVED = -1;
  var STATE_REJECTED = 0;
  var STATE_RESOLVED = 1;
  var STATE_THUNK = 2;
  var ARGS_ERR = 0;
  var ARGS_VAL = 1;

  var COLOR_ERROR  = typeof window !== 'undefined' ? '' : '\x1b[35m';
  var COLOR_NORMAL = typeof window !== 'undefined' ? '' : '\x1b[m';

  var slice = [].slice;

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

  // getProto(obj)
  var getProto = Object.getPrototypeOf || {}.__proto__ ?
    function getProto(obj) { return obj.__proto__; } : null;

  // setProto(obj, proto)
  var setProto = Object.setPrototypeOf || {}.__proto__ ?
    function setProto(obj, proto) { obj.__proto__ = proto; } : null;

  // Queue
  function Queue() {
    this.tail = this.head = null;
  }
  // Queue#push(x)
  setValue(Queue.prototype, 'push', function push(x) {
    if (this.tail)
      this.tail = this.tail[1] = [x, null];
    else
      this.tail = this.head = [x, null];
  });
  // Queue#shift()
  setValue(Queue.prototype, 'shift', function shift() {
    if (!this.head) return null;
    var x = this.head[0];
    this.head = this.head[1];
    if (!this.head) this.tail = null;
    return x;
  });

  // nextTick(fn)
  var nextTickDo = typeof setImmediate === 'function' ? setImmediate :
    typeof process === 'object' && process && typeof process.nextTick === 'function' ? process.nextTick :
    function nextTick(fn) { setTimeout(fn, 0); };

  var tasksHighPrio = new Queue();
  var tasksLowPrio = new Queue();

  var nextTickProgress = false;

  // nextTick(fn, fnLow)
  function nextTick(fn, fnLow) {
    if (typeof fn === 'function')
      tasksHighPrio.push(fn);

    if (typeof fnLow === 'function')
      tasksLowPrio.push(fnLow);

    if (nextTickProgress) return;

    nextTickProgress = true;

    nextTickDo(function () {
      var fn;

      for (;;) {
        while (fn = tasksHighPrio.shift())
          fn();

        fn = tasksLowPrio.shift();
        if (!fn) break;

        fn();
      }

      nextTickProgress = false;
    });
  }

  function PROMISE_RESOLVE() {}
  function PROMISE_REJECT() {}
  function PROMISE_THEN() {}

  setProto(PromiseThunk.prototype, Function.prototype);

  // PromiseThunk(setup(resolve, reject))
  function PromiseThunk(setup) {
    var $callbacks = new Queue();
    var $state = STATE_UNRESOLVED;
    var $args;
    var $handled = false;

    setProto(thunk, PromiseThunk.prototype);
    thunk.then = then;
    thunk['catch'] = caught;
    thunk.toString = toString;

    if (setup === PROMISE_RESOLVE)
      resolve(arguments[1]);
    else if (setup === PROMISE_REJECT)
      reject(arguments[1]);
    else if (typeof setup === 'function')
      // setup(res, rej)
      try {
        setup.call(thunk, resolve, reject);
      } catch (err) {
        reject(err);
      }
    else {
      // no setup, public promise
      setConst(thunk, '$resolve', resolve);
      setConst(thunk, '$reject',  reject);
    }

    // resolve(val)
    function resolve(val) {
      if ($args) return;

      // is promise?
      if (isPromise(val)) {
        return val.then(function (v) { cb(null, v); }, cb);
      }

      // is function? must be thunk.
      if (typeof val === 'function')
        return val(cb);

      cb(null, val);
    }

    // reject(err)
    function reject(err) {
      if ($args) return;
      cb(err);
    }

    // fire()
    function fire() {
      var elem;
      if (!$args) return; // not yet fired
      while (elem = $callbacks.shift()) {
        $handled = true;
        if (elem[STATE_THUNK]) elem[STATE_THUNK].apply(null, $args);
        else if (elem[$state]) elem[$state]($args[$state]);
      }
      nextTick(null, $checkUnhandledRejection);
    }

    // $checkUnhandledRejection
    function $checkUnhandledRejection() {
      if ($state === STATE_REJECTED && !$handled) {
        console.error(COLOR_ERROR + 'Unhandled rejection ' +
            ($args[ARGS_ERR] instanceof Error ? $args[ARGS_ERR].stack || $args[ARGS_ERR] : $args[ARGS_ERR]) +
            COLOR_NORMAL);
        // or throw $args[0];
        // or process.emit...
      }
    } // $checkUnhandledRejection

    // cb(err, val) or cb(...$args)
    function cb() {
      if ($args) return; // already fired
      $args = arguments;
      $state = $args[ARGS_ERR] ? STATE_REJECTED : STATE_RESOLVED;
      nextTick(fire);
    }

    // thunk(cb)
    function thunk(cb) {
      if (typeof cb !== 'function')
        new TypeError('callback must be a function');

      var p = PromiseThunk();
      $callbacks.push([undefined, undefined,
        function (err, val) {
          try {
            if (err) p.$resolve(cb(err));
            else p.$resolve(cb.apply(null, arguments));
          } catch (e) { p.$reject(e); } }
      ]);
      nextTick(fire);
      return p;
    }

    // PromiseThunk#then(res, rej)
    function then(res, rej) {
      if (res && typeof res !== 'function')
        new TypeError('resolved must be a function');
      if (rej && typeof rej !== 'function')
        new TypeError('rejected must be a function');

      var p = PromiseThunk();
      $callbacks.push([
        function (err) { try { p.$resolve(rej(err)); } catch (e) { p.$reject(e); } },
        function (val) { try { p.$resolve(res(val)); } catch (e) { p.$reject(e); } }
      ]);
      nextTick(fire);
      return p;
    } // then

    // PromiseThunk#catch(rej)
    function caught(rej) {
      if (rej && typeof rej !== 'function')
        new TypeError('rejected must be a function');

      var p = PromiseThunk();
      $callbacks.push([
        function (err) { try { p.$resolve(rej(err)); } catch (e) { p.$reject(e); } }
      ]);
      nextTick(fire);
      return p;
    } // catch

    // PromiseThunk#toString()
    function toString() {
      return 'PromiseThunk { ' + (
        $state === STATE_UNRESOLVED ? '<pending>' :
        $state === STATE_RESOLVED ? JSON.stringify($args[ARGS_VAL]) :
        '<rejected> ' + $args[ARGS_ERR]) + ' }';
    }; // toString

    return thunk;
  }

  // PromiseThunk.wrap(fn)
  setValue(PromiseThunk, 'wrap', function wrap(fn) {
    return function () {
      var $args = slice.call(arguments);
      return PromiseThunk(function (res, rej) {
        fn.apply(null, $args.concat(
          function (err, val) {
            try { if (err) rej(err); else res(val); } catch (e) { rej(e); } }));
      });
    }
  });

  // PromiseThunk.resolve(val)
  setValue(PromiseThunk, 'resolve', function resolve(val) {
    return PromiseThunk(PROMISE_RESOLVE, val);
  });

  // PromiseThunk.reject(err)
  setValue(PromiseThunk, 'reject', function reject(err) {
    return PromiseThunk(PROMISE_REJECT, err);
  });

  // PromiseThunk.all([p, ...])
  setValue(PromiseThunk, 'all', function all(promises) {
    if (isIterator(promises)) promises = makeArrayFromIterator(promises);
    if (!(promises instanceof Array))
      throw new TypeError('promises must be an array');
    return PromiseThunk(
      function promiseAll(resolve, reject) {
        var n = promises.length;
        if (n === 0) return resolve([]);
        var res = Array(n);
        promises.forEach(function (p, i) {
          function complete(val) {
            res[i] = val; if (--n === 0) resolve(res); }
          if (p instanceof PromiseThunk || isPromise(p))
            return p.then(complete, reject);
          complete(p);
        }); // promises.forEach
      }
    ); // return PromiseThunk
  }); // all

  // PromiseThunk.race([p, ...])
  setValue(PromiseThunk, 'race', function race(promises) {
    if (isIterator(promises)) promises = makeArrayFromIterator(promises);
    if (!(promises instanceof Array))
      throw new TypeError('promises must be an array');
    return PromiseThunk(
      function promiseRace(resolve, reject) {
        promises.forEach(function (p) {
          if (p instanceof PromiseThunk || isPromise(p))
            return p.then(resolve, reject);
          resolve(p);
        }); // promises.forEach
      }
    ); // return PromiseThunk
  }); // race

  // isPromise(p)
  setValue(PromiseThunk, 'isPromise', isPromise);
  function isPromise(p) {
    return !!p && typeof p.then === 'function';
  }

  // PromiseThunk.accept(val)
  setValue(PromiseThunk, 'accept', PromiseThunk.resolve);

  // PromiseThunk.defer()
  setValue(PromiseThunk, 'defer', function defer() {
    var p = PromiseThunk();
    return {promise: p, resolve: p.$resolve, reject: p.$reject};
  });

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

  if (typeof module === 'object' && module && module.exports)
    module.exports = PromiseThunk;

  setValue(PromiseThunk, 'PromiseThunk', PromiseThunk);
  setValue(PromiseThunk, 'Promise', Promise);
  return PromiseThunk;

}();
