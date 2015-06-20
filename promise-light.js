// promise-light.js

this.PromiseLight = function () {
  'use strict';

  var STATE_UNRESOLVED = -1;
  var STATE_RESOLVED = 0;
  var STATE_REJECTED = 1;

  var COLOR_OK     = typeof window !== 'undefined' ? '' : '\x1b[32m';
  var COLOR_ERROR  = typeof window !== 'undefined' ? '' : '\x1b[35m';
  var COLOR_NORMAL = typeof window !== 'undefined' ? '' : '\x1b[m';

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
  setValue(Queue.prototype, 'push', function push(x) {
    if (this.tail)
      this.tail = this.tail[1] = [x, null];
    else
      this.tail = this.head = [x, null];
    return this;
  });
  setValue(Queue.prototype, 'shift', function shift() {
    if (!this.head) return null;
    var x = this.head[0];
    this.head = this.head[1];
    if (!this.head) this.tail = null;
    return x;
  });

  // nextTickDo(fn)
  var nextTickDo = typeof setImmediate === 'function' ? setImmediate :
    typeof process === 'object' && process && typeof process.nextTick === 'function' ? process.nextTick :
    function nextTick(fn) { setTimeout(fn, 0); };

  var tasks = new Queue();

  var nextTickProgress = false;

  // nextTick(ctx, fn)
  function nextTick(ctx, fn) {
    tasks.push({ctx:ctx, fn:fn});

    if (nextTickProgress) return;
    nextTickProgress = true;

    nextTickDo(function () {
      var task;

      while (task = tasks.shift())
        task.fn.call(task.ctx);

      nextTickProgress = false;
    });
  }

  // isPromise
  function isPromise(p) {
    return p instanceof PromiseLight || p && typeof p.then === 'function';
  }

  // isIterator(iter)
  function isIterator(iter) {
    return !!iter && (typeof iter.next === 'function' || isIterable(iter));
  }

  // isIterable(iter)
  function isIterable(iter) {
    return !!iter && typeof Symbol === 'function' && Symbol &&
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

  function PROMISE_RESOLVE() {}
  function PROMISE_REJECT() {}
  function PROMISE_THEN() {}

  // PromiseLight(setup(resolve, reject))
  function PromiseLight(setup, val, rej, $that) {
    var $this = this;
    this.$callbacks = new Queue();
    this.$handled = false;

    if (setup === PROMISE_RESOLVE) {
      this.$state = STATE_RESOLVED;
      this.$result = val;
    }
    else if (setup === PROMISE_REJECT) {
      this.$state = STATE_REJECTED;
      this.$result = val;
    }
    else {
      this.$state = STATE_UNRESOLVED;
      this.$result = undefined;

      if (setup === PROMISE_THEN) {
        $that.$callbacks.push([val, rej, resolve, reject]);
        if ($that.$state !== STATE_UNRESOLVED)
          nextTick($that, $$fire);
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
        setConst(this, '$resolve', resolve);
        setConst(this, '$reject',  reject);
      }

    }

    // resolve(val)
    function resolve(val) {
      if ($this.$state === STATE_UNRESOLVED)
        $this.$state = STATE_RESOLVED, $this.$result = val, nextTick($this, $$fire);
    }

    // reject(err)
    function reject(err) {
      if ($this.$state === STATE_UNRESOLVED)
        $this.$state = STATE_REJECTED, $this.$result = err, nextTick($this, $$fire);
      else {
        console.info(COLOR_OK + $this + COLOR_NORMAL);
        console.error(COLOR_ERROR + 'Unhandled 2nd rejection: ' + err2str(err) + COLOR_NORMAL);
      }
    }

  } // PromiseLight

  // then(resolved, rejected)
  setValue(PromiseLight.prototype, 'then', then);
  function then(resolved, rejected) {
    if (resolved != null && typeof resolved !== 'function')
      throw new TypeError('resolved must be a function');
    if (rejected != null && typeof rejected !== 'function')
      throw new TypeError('rejected must be a function');

    return new PromiseLight(PROMISE_THEN, resolved, rejected, this);
  } // then

  // catch(rejected)
  setValue(PromiseLight.prototype, 'catch', caught);
  function caught(rejected) {
    if (rejected != null && typeof rejected !== 'function')
      throw new TypeError('rejected must be a function');

    return new PromiseLight(PROMISE_THEN, undefined, rejected, this);
  } // catch

  // PromiseLight#toString()
  setValue(PromiseLight.prototype, 'toString', toString);
  var $$toString = toString;
  function toString() {
    return 'PromiseLight { ' + (
      this.$state === STATE_UNRESOLVED ? '<pending>' :
      this.$state === STATE_RESOLVED ? this.$result :
      '<rejected> ' + this.$result) + ' }';
  } // toString

  // $$fire
  //setValue(PromiseLight.prototype, '$fire', $$fire);
  function $$fire() {
    var $this = this;
    var $state = this.$state;
    var $result = this.$result;
    var elem;
    while (elem = $this.$callbacks.shift()) {
      (function (elem) {
        $this.$handled = true;
        var resolve = elem[2], reject = elem[3];
        var completed = elem[$state];
        function complete(val) {
          resolve(completed.call($this, val)); }
        try {
          if ($state === STATE_RESOLVED) {
            if (!completed) return resolve($result);
            if ($result instanceof PromiseLight || isPromise($result))
              return $result.then(complete, reject);
          }
          else { // $state === STATE_REJECTED
            if (!completed) return reject($result);
          }
          complete($result);
        } catch (err) {
          reject(err);
        }
      })(elem);
    } // while $this.$callbacks.shift()
    nextTick($this, $$checkUnhandledRejection);
  } // $$fire

  // $$checkUnhandledRejection
  function $$checkUnhandledRejection() {
    if (this.$state === STATE_REJECTED && !this.$handled) {
      console.error(COLOR_ERROR + 'Unhandled rejection ' +
          (this.$result instanceof Error ? err2str(this.$result) : this.$result) +
          COLOR_NORMAL);
      // or throw this.$result;
      // or process.emit...
    }
  } // $$checkUnhandledRejection

  // base-class-extend
  function extend(proto) {
    var ctor = proto.constructor;
    function super_() { this.constructor = ctor; }
    super_.prototype = this.prototype;
    ctor.prototype = new super_();
    for (var p in proto) if (proto.hasOwnProperty(p)) ctor.prototype[p] = proto[p];
    return ctor;
  }

  // PromiseLightResolved
  var PromiseLightResolved = extend.call(PromiseLight, {
      constructor: function PromiseLightResolved(val) {
        this.$result = val;
      },
      $state: STATE_RESOLVED,
      then: function then(res, rej) {
        if (res && typeof res !== 'function')
          throw new TypeError('then resolved must be function');
        if (rej && typeof rej !== 'function')
          throw new TypeError('then rejected must be function');

        if (res)
          nextTick(this, function () {
            var val = this.$result;
            if (isPromise(val))
              val.then(
                function (v) {
                  try { return res(v); }
                  catch (e) { var errs = [e]; }
                  try { if (rej) return rej(e); }
                  catch (e2) { errs.push(e2); }
                  while (e = errs.shift())
                    console.error(COLOR_ERROR +
                      'Unhandled rejction : ' + err2str(e) + COLOR_NORMAL);
                },
                function (e) {
                  var errs = [e];
                  try { if (rej) return rej(e); }
                  catch (e2) { errs.push(e2); }
                  while (e = errs.shift())
                    console.error(COLOR_ERROR +
                      'Unhandled rejction : ' + err2str(e) + COLOR_NORMAL);
                });
            else {
              try { return res(val); }
              catch (e) { var errs = [e]; }
              try { if (rej) return rej(e); }
              catch (e2) { errs.push(e2); }
              while (e = errs.shift())
                console.error(COLOR_ERROR +
                  'Unhandled rejction : ' + err2str(e) + COLOR_NORMAL);
            }
          });
        return $$$resolved;
      },
      'catch': function caught(rej) {
        return $$$resolved;
      }
    });
  var $$$resolved = new PromiseLightResolved();

  // PromiseLightRejected
  var PromiseLightRejected = extend.call(PromiseLight, {
      constructor: function PromiseLightRejected(err) {
        this.$result = err;
        this.$callbacks = new Queue();
      },
      $state: STATE_REJECTED,
      then: function then(res, rej) {
        if (res && typeof res !== 'function')
          throw new TypeError('then resolved must be function');
        if (rej && typeof rej !== 'function')
          throw new TypeError('then rejected must be function');

        nextTick(this, function () {
          var errs = [this.$result];
          try { if (rej) return rej(this.$result); }
          catch (e) { errs.push(e); }
          while (e = errs.shift())
            console.error(COLOR_ERROR +
              'Unhandled rejction : ' + err2str(e) + COLOR_NORMAL); });
        return $$$resolved;
      },
      'catch': function caught(rej) {
        if (typeof rej !== 'function')
          throw new TypeError('catch rejected must be function');

        nextTick(this, function () {
          var errs = [this.$result];
          try { rej(this.$result); }
          catch (e) { errs.push(e); }
          while (e = errs.shift())
            console.error(COLOR_ERROR +
              'Unhandled rejction : ' + err2str(e) + COLOR_NORMAL); });
        return $$$resolved;
      }
    });

  // PromiseLight.resolve(val)
  setValue(PromiseLight, 'resolve', function resolve(val) {
    return new PromiseLightResolved(val); });

  // PromiseLight.reject(err)
  setValue(PromiseLight, 'reject', function reject(err) {
    return new PromiseLightRejected(err); });

  // PromiseLight.all([p, ...])
  setValue(PromiseLight, 'all', all);
  function all(promises) {
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
    ); // return new PromiseLight
  } // all

  // PromiseLight.race([p, ...])
  setValue(PromiseLight, 'race', race);
  function race(promises) {
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
    ); // return new PromiseLight
  } // race

  // PromiseLight.accept(val)
  setValue(PromiseLight, 'accept', PromiseLight.resolve);

  // PromiseLight.defer()
  setValue(PromiseLight, 'defer', defer);
  function defer() {
    var p = new PromiseLight();
    return {promise: p, resolve: p.$resolve, reject: p.$reject};
  }

  function err2str(err) {
    var msg = err.stack || (err + '');
    return msg.split('\n').filter(filterExcludeMocha).join('\n');
  }

  function filterExcludeMocha(s) {
    return !s.match(/node_modules.*mocha/);
  }

  if (typeof module === 'object' && module.exports)
    module.exports = PromiseLight;

  return PromiseLight;

}();

this.Promise = typeof Promise === 'function' ? Promise : this.PromiseLight;
