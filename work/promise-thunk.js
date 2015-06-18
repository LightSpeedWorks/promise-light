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

  // nextTick(ctx, fn, fnLow)
  function nextTick(ctx, fn, fnLow) {
    if (typeof fn === 'function')
      tasksHighPrio.push([ctx, fn]);

    if (typeof fnLow === 'function')
      tasksLowPrio.push([ctx, fnLow]);

    if (nextTickProgress) return;

    nextTickProgress = true;

    nextTickDo(function () {
      var ctx, fn, pair;

      for (;;) {
        while (pair = tasksHighPrio.shift()) {
          ctx = pair[0];
          fn = pair[1];
          fn.call(ctx);
        }

        pair = tasksLowPrio.shift();
        if (!pair) break;

        ctx = pair[0];
        fn = pair[1];
        fn.call(ctx);
      }

      nextTickProgress = false;
    });
  }

  function PROMISE_RESOLVE() {}
  function PROMISE_REJECT() {}
  function PROMISE_THEN() {}

  // PromiseThunk(setup(resolve, reject))
  function PromiseThunk(setup) {
    if (setup && typeof setup.then === 'function')
      return $$convert(setup);

    thunk.$callbacks = new Queue();
    thunk.$state = STATE_UNRESOLVED;
    thunk.$args = undefined;
    thunk.$handled = false;

    if (setProto)
      setProto(thunk, PromiseThunk.prototype);
    else {
      if (thunk.then     !== $$then)
          thunk.then     =   $$then;
      if (thunk['catch'] !== $$catch)
          thunk['catch'] =   $$catch;
      if (thunk.toString !== $$toString)
          thunk.toString =   $$toString;
    }

    if (typeof setup === 'function') {
      if (setup === PROMISE_RESOLVE)
        $$resolve.call(thunk, arguments[1]);
      else if (setup === PROMISE_REJECT)
        $$reject.call(thunk, arguments[1]);
      else {
        // setup(resolve, reject)
        try {
          setup.call(thunk,
            function resolve() { return $$resolve.apply(thunk, arguments); },
            function reject()  { return $$reject.apply(thunk, arguments); });
        } catch (err) {
          $$reject.call(thunk, err);
        }
      }
    }

    // thunk(cb)
    function thunk(cb) {
      if (typeof cb !== 'function')
        throw new TypeError('callback must be a function');

      var p = PromiseThunk();
      thunk.$callbacks.push([undefined, undefined,
        function (err, val) {
          try {
            if (err) $$resolve.call(p, cb(err));
            else     $$resolve.call(p, cb.apply(null, arguments));
          } catch (e) { $$reject.call(p, e); } }
      ]);
      nextTick(thunk, $$fire);
      return p;
    }

    return thunk;
  }

  // $$callback(err, val) or $callback(...$args)
  function $$callback() {
    if (this.$args) return; // already fired
    this.$args = arguments;
    this.$state = arguments[ARGS_ERR] ? STATE_REJECTED : STATE_RESOLVED;
    nextTick(this, $$fire);
  }

  // $$resolve(val)
  function $$resolve(val) {
    var thunk = this;
    if (thunk.$args) return;

    // is promise?
    if (isPromise(val)) {
      val.then(
        function (v) { $$callback.call(thunk, null, v); },
        function (e) { $$callback.apply(thunk, arguments); });
      return;
    }

    // is function? must be thunk.
    if (typeof val === 'function') {
      val(function (e) { $$callback.apply(thunk, arguments); });
      return;
    }

    $$callback.call(thunk, null, val);
  } // $$resolve

  // $$reject(err)
  var $$reject = $$callback;

  // $$fire()
  function $$fire() {
    var elem;
    var $args = this.$args;
    var $state = this.$state;
    var $callbacks = this.$callbacks;
    if (!$args) return; // not yet fired
    while (elem = $callbacks.shift()) {
      this.$handled = true;
      if (elem[STATE_THUNK]) elem[STATE_THUNK].apply(null, $args);
      else if (elem[$state]) elem[$state]($args[$state]);
    }
    nextTick(this, null, $$checkUnhandledRejection);
  } // $$fire

  // $$checkUnhandledRejection()
  function $$checkUnhandledRejection() {
    var $args = this.$args;
    if (this.$state === STATE_REJECTED && !this.$handled) {
      console.error(COLOR_ERROR + 'Unhandled rejection ' +
          ($args[ARGS_ERR] instanceof Error ? $args[ARGS_ERR].stack ||
           $args[ARGS_ERR] : $args[ARGS_ERR]) +
          COLOR_NORMAL);
      // or throw $args[0];
      // or process.emit...
    }
  } // $$checkUnhandledRejection

  // PromiseThunk#then(res, rej)
  setValue(PromiseThunk.prototype, 'then', function then(res, rej) {
    if (res && typeof res !== 'function')
      throw new TypeError('resolved must be a function');
    if (rej && typeof rej !== 'function')
      throw new TypeError('rejected must be a function');

    var p = PromiseThunk();
    this.$callbacks.push([
      function (err) { try { $$resolve.call(p, rej(err)); } catch (e) { $$reject.call(p, e); } },
      function (val) { try { $$resolve.call(p, res(val)); } catch (e) { $$reject.call(p, e); } }
    ]);
    nextTick(this, $$fire);
    return p;
  }); // then
  var $$then = PromiseThunk.prototype.then;

  // PromiseThunk#catch(rej)
  setValue(PromiseThunk.prototype, 'catch', function caught(rej) {
    if (rej && typeof rej !== 'function')
      throw new TypeError('rejected must be a function');

    var p = PromiseThunk();
    this.$callbacks.push([
      function (err) { try { $$resolve.call(p, rej(err)); } catch (e) { $$reject.call(p, e); } }
    ]);
    nextTick(this, $$fire);
    return p;
  }); // catch
  var $$catch = PromiseThunk.prototype['catch'];

  // PromiseThunk#toString()
  setValue(PromiseThunk.prototype, 'toString', function toString() {
    return 'PromiseThunk { ' + (
      this.$state === STATE_UNRESOLVED ? '<pending>' :
      this.$state === STATE_RESOLVED ? JSON.stringify(this.$args[ARGS_VAL]) :
      '<rejected> ' + this.$args[ARGS_ERR]) + ' }';
  }); // toString
  var $$toString = PromiseThunk.prototype.toString;

  // PromiseThunk.wrap(fn)
  setValue(PromiseThunk, 'wrap', function wrap(fn) {
    if (typeof fn !== 'function')
      throw new TypeError('wrap: fn must be a function');

    return function () {
      var $args = slice.call(arguments);
      return PromiseThunk(function (res, rej) {
        fn.apply(null, $args.concat(
          function (err, val) {
            try {
              if (err) rej(err);
              else     res(val);
            } catch (e) {
              rej(e);
            }
        }));
      });
    }
  }); // wrap

  // PromiseThunk.resolve(val)
  setValue(PromiseThunk, 'resolve', function resolve(val) {
    return PromiseThunk(PROMISE_RESOLVE, val);
  });

  // PromiseThunk.reject(err)
  setValue(PromiseThunk, 'reject', function reject(err) {
    return PromiseThunk(PROMISE_REJECT, err);
  });

  // PromiseThunk.convert(promise or thunk)
  setValue(PromiseThunk, 'convert', function convert(promise) {
    if (isPromise(promise)) {
      var p = PromiseThunk();
      promise.then(
        function (v) { $$resolve.call(p, v); },
        function (e) { $$reject.apply(p, arguments); });
      return p;
    }
    return PromiseThunk(PROMISE_RESOLVE, val);
  });
  var $$convert = PromiseThunk.convert;

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
    return {promise: p,
            resolve: function resolve() { $$resolve.apply(p, arguments); },
            reject:  function reject()  { $$reject.apply(p, arguments); }};
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
