// promise-light.js

this.PromiseLight = function () {
  'use strict';

  var STATE_UNRESOLVED = -1;
  var STATE_REJECTED = 0;
  var STATE_RESOLVED = 1;
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
      tasksHighPrio.push({ctx:ctx, fn:fn});

    if (typeof fnLow === 'function')
      tasksLowPrio.push({ctx:ctx, fn:fnLow});

    if (nextTickProgress) return;

    nextTickProgress = true;

    nextTickDo(function () {
      var e;

      for (;;) {
        while (e = tasksHighPrio.shift())
          e.fn.call(e.ctx);

        e = tasksLowPrio.shift();
        if (!e) break;

        e.fn.call(e.ctx);
      }

      nextTickProgress = false;
    });
  }

  function PROMISE_RESOLVE() {}
  function PROMISE_REJECT() {}
  function PROMISE_THEN() {}

  // PromiseLight(setup(resolve, reject))
  function PromiseLight(setup, opt) {
    if (setup && typeof setup.then === 'function')
      return $$convert(setup);

    if (!(this instanceof PromiseLight))
      return new PromiseLight(setup, opt);

    var thunk = this;

    thunk.$callbacks = new Queue();
    thunk.$state = STATE_UNRESOLVED;
    thunk.$args = undefined;
    thunk.$handled = false;

    if (typeof setup === 'function') {
      if (setup === PROMISE_RESOLVE)
        $$resolve.call(thunk, opt);
      else if (setup === PROMISE_REJECT)
        $$reject.call(thunk, opt);
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
  } // PromiseLight

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
      if (elem[$state]) elem[$state]($args[$state]);
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

  // PromiseLight#then(res, rej)
  setValue(PromiseLight.prototype, 'then', function then(res, rej) {
    if (res && typeof res !== 'function')
      throw new TypeError('resolved must be a function');
    if (rej && typeof rej !== 'function')
      throw new TypeError('rejected must be a function');

    var p = new PromiseLight();
    this.$callbacks.push([
      function (err) { try { $$resolve.call(p, rej(err)); } catch (e) { $$reject.call(p, e); } },
      function (val) { try { $$resolve.call(p, res(val)); } catch (e) { $$reject.call(p, e); } }
    ]);
    nextTick(this, $$fire);
    return p;
  }); // then
  var $$then = PromiseLight.prototype.then;

  // PromiseLight#catch(rej)
  setValue(PromiseLight.prototype, 'catch', function caught(rej) {
    if (rej && typeof rej !== 'function')
      throw new TypeError('rejected must be a function');

    var p = new PromiseLight();
    this.$callbacks.push([
      function (err) { try { $$resolve.call(p, rej(err)); } catch (e) { $$reject.call(p, e); } }
    ]);
    nextTick(this, $$fire);
    return p;
  }); // catch
  var $$catch = PromiseLight.prototype['catch'];

  // PromiseLight#toString()
  setValue(PromiseLight.prototype, 'toString', function toString() {
    return 'PromiseLight { ' + (
      this.$state === STATE_UNRESOLVED ? '<pending>' :
      this.$state === STATE_RESOLVED ? JSON.stringify(this.$args[ARGS_VAL]) :
      '<rejected> ' + this.$args[ARGS_ERR]) + ' }';
  }); // toString
  var $$toString = PromiseLight.prototype.toString;

  // PromiseLight.wrap(fn)
  function wrap(fn) {
    if (typeof fn !== 'function')
      throw new TypeError('wrap: fn must be a function');

    return function () {
      var $args = slice.call(arguments);
      return new PromiseLight(function (res, rej) {
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
  } // wrap
  setValue(PromiseLight, 'wrap',     wrap);
  setValue(PromiseLight, 'thunkify', wrap);

  // PromiseLight.resolve(val)
  setValue(PromiseLight, 'resolve', function resolve(val) {
    return new PromiseLight(PROMISE_RESOLVE, val);
  });

  // PromiseLight.reject(err)
  setValue(PromiseLight, 'reject', function reject(err) {
    return new PromiseLight(PROMISE_REJECT, err);
  });

  // PromiseLight.convert(promise or thunk)
  setValue(PromiseLight, 'convert', function convert(promise) {
    if (isPromise(promise)) {
      var p = new PromiseLight();
      promise.then(
        function (v) { $$resolve.call(p, v); },
        function (e) { $$reject.apply(p, arguments); });
      return p;
    }
    return new PromiseLight(PROMISE_RESOLVE, val);
  });
  var $$convert = PromiseLight.convert;

  // PromiseLight.all([p, ...])
  setValue(PromiseLight, 'all', function all(promises) {
    if (isIterator(promises)) promises = makeArrayFromIterator(promises);
    if (!(promises instanceof Array))
      throw new TypeError('promises must be an array');

    return new PromiseLight(
      function promiseAll(resolve, reject) {
        var n = promises.length;
        if (n === 0) return resolve([]);
        var res = Array(n);
        promises.forEach(function (p, i) {
          function complete(val) {
            res[i] = val; if (--n === 0) resolve(res); }
          if (p instanceof PromiseLight || isPromise(p))
            return p.then(complete, reject);
          complete(p);
        }); // promises.forEach
      }
    ); // return PromiseLight
  }); // all

  // PromiseLight.race([p, ...])
  setValue(PromiseLight, 'race', function race(promises) {
    if (isIterator(promises)) promises = makeArrayFromIterator(promises);
    if (!(promises instanceof Array))
      throw new TypeError('promises must be an array');

    return new PromiseLight(
      function promiseRace(resolve, reject) {
        promises.forEach(function (p) {
          if (p instanceof PromiseLight || isPromise(p))
            return p.then(resolve, reject);
          resolve(p);
        }); // promises.forEach
      }
    ); // return PromiseLight
  }); // race

  // isPromise(p)
  setValue(PromiseLight, 'isPromise', isPromise);
  function isPromise(p) {
    return !!p && typeof p.then === 'function';
  }

  // PromiseLight.accept(val)
  setValue(PromiseLight, 'accept', PromiseLight.resolve);

  // PromiseLight.defer()
  setValue(PromiseLight, 'defer', function defer() {
    var p = new PromiseLight();
    return {promise: p,
            resolve: function resolve() { $$resolve.apply(p, arguments); },
            reject:  function reject()  { $$reject.apply(p, arguments); }};
  });

  // isIterator(iter)
  function isIterator(iter) {
    return iter && (typeof iter.next === 'function' || isIterable(iter));
  }
  setValue(PromiseLight, 'isIterator', isIterator);

  // isIterable(iter)
  function isIterable(iter) {
    return iter && typeof Symbol === 'function' && Symbol &&
           Symbol.iterator && typeof iter[Symbol.iterator] === 'function';
  }
  setValue(PromiseLight, 'isIterable', isIterable);

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
  setValue(PromiseLight, 'makeArrayFromIterator', makeArrayFromIterator);

  if (typeof module === 'object' && module && module.exports)
    module.exports = PromiseLight;

  setValue(PromiseLight, 'PromiseLight', PromiseLight);
  setValue(PromiseLight, 'Promise', Promise);
  return PromiseLight;

}();
