// promise-light.js

this.PromiseLight = function () {
  'use strict';

  var UNRESOLVED = -1,
      RESOLVED = 0,
      REJECTED = 1;

  var COLOR_ERROR  = typeof window !== 'undefined' ? '' : '\x1b[35m';
  var COLOR_NORMAL = typeof window !== 'undefined' ? '' : '\x1b[m';

  // Queue
  function Queue() {
    this.tail = this.head = null;
  }
  Queue.prototype.push = function push(x) {
    if (this.tail)
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

  // nextTick(fn)
  var nextTickDo = typeof setImmediate === 'function' ? setImmediate :
    typeof process === 'object' && process && typeof process.nextTick === 'function' ? process.nextTick :
    function nextTick(fn) { setTimeout(fn, 0); };

  var queue = new Queue();

  var nextTickProgress = false;
  // nextTick(fn)
  function nextTick(fn) {
    queue.push(fn);
    if (nextTickProgress) return;

    nextTickProgress = true;

    nextTickDo(function () {
      var fn;

      while (fn = queue.shift())
        fn();

      nextTickProgress = false;
    });
  }

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
    var $this = this;
    this.$queue = new Queue();
    this.$handled = false;
    var $fire = function () { $this.$fire(); };

    if (setup === PROMISE_RESOLVE) {
      this.$state = RESOLVED;
      this.$result = arguments[1];
    }
    else if (setup === PROMISE_REJECT) {
      this.$state = REJECTED;
      this.$result = arguments[1];
    }
    else {
      this.$state = UNRESOLVED;
      this.$result = undefined;

      if (setup === PROMISE_THEN) {
        var $that = arguments[3];
        $that.$queue.push([arguments[1], arguments[2], resolve, reject]);
        if ($that.$state !== UNRESOLVED)
          nextTick(function () { $that.$fire(); });
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

    // resolve(val)
    function resolve(val) {
      if ($this.$state === UNRESOLVED)
        $this.$state = RESOLVED, $this.$result = val, nextTick($fire);
    }

    // reject(err)
    function reject(err) {
      if ($this.$state === UNRESOLVED)
        $this.$state = REJECTED, $this.$result = err, nextTick($fire);
    }

  } // Promise

  // then(resolved, rejected)
  setValue(Promise.prototype, 'then', function then(resolved, rejected) {
    if (resolved != null && typeof resolved !== 'function')
      throw new TypeError('resolved must be a function');
    if (rejected != null && typeof rejected !== 'function')
      throw new TypeError('rejected must be a function');

    return new Promise(PROMISE_THEN, resolved, rejected, this);
  }); // then

  // catch(rejected)
  setValue(Promise.prototype, 'catch', function caught(rejected) {
    if (rejected != null && typeof rejected !== 'function')
      throw new TypeError('rejected must be a function');

    return new Promise(PROMISE_THEN, undefined, rejected, this);
  }); // catch

  // $fire
  setValue(Promise.prototype, '$fire', function $fire() {
    var $this = this;
    var elem;
    while (elem = $this.$queue.shift()) {
      (function (elem) {
        $this.$handled = true;
        var resolve = elem[2], reject = elem[3];
        var completed = elem[$this.$state];
        function complete(val) {
          resolve(completed.call($this, val)); }
        try {
          if ($this.$state === RESOLVED) {
            if (!completed) return resolve($this.$result);
            if ($this.$result instanceof Promise || isPromise($this.$result))
              return $this.$result.then(complete, reject);
          }
          else { // $this.$state === REJECTED
            if (!completed) return reject($this.$result);
          }
          complete($this.$result);
        } catch (err) {
          reject(err);
        }
      })(elem);
    } // while $this.$queue.shift()
    nextTick(function () { $this.$checkUnhandledRejection(); });
  }); // $fire

  // $checkUnhandledRejection
  setValue(Promise.prototype, '$checkUnhandledRejection', function $checkUnhandledRejection() {
    if (this.$state === REJECTED && !this.$handled) {
      console.error(COLOR_ERROR + 'Unhandled rejection ' +
          (this.$result instanceof Error ? this.$result.stack || this.$result : this.$result) +
          COLOR_NORMAL);
      // or throw this.$result;
      // or process.emit...
    }
  }); // $checkUnhandledRejection

  // Promise.resolve(val)
  setValue(Promise, 'resolve', function resolve(val) {
    return new Promise(PROMISE_RESOLVE, val); });

  // Promise.reject(err)
  setValue(Promise, 'reject', function reject(err) {
    return new Promise(PROMISE_REJECT, err); });

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
    var p = new Promise();
    return {promise: p, resolve: p.resolve, reject: p.reject};
  });

  if (typeof module === 'object' && module.exports)
    module.exports = Promise;

  return Promise;

}();

this.Promise = typeof Promise === 'function' ? Promise : this.PromiseLight;
