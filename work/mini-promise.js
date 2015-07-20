// mini-promise.js

this.MiniPromise = function () {
  'use strict';

  var STATE_UNRESOLVED = 0;
  var STATE_RESOLVED = 1;
  var STATE_REJECTED = 2;

  var COLOR_OK     = typeof window !== 'undefined' ? '' : '\x1b[32m';
  var COLOR_ERROR  = typeof window !== 'undefined' ? '' : '\x1b[35m';
  var COLOR_NORMAL = typeof window !== 'undefined' ? '' : '\x1b[m';

  var nextTick = typeof setImmediate !== 'undefined' ? setImmediate :
    typeof process !== 'undefined' ? process.nextTick :
    function nextTick(fn) { setTimeout(fn, 0); };

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

  function MiniPromise(setup) {
    if (!(this instanceof MiniPromise)) return new MiniPromise(setup);
    var p = this;
    p.$state = STATE_UNRESOLVED, p.$value = undefined, p.$callbacks = [];
    p.$handled = false, p.$handledRejection = false;
    p.$$fire = fire;
    if (typeof setup === 'function')
      try { setup.call(this, resolve, reject); } catch (e) { reject(e); }
    else p.$resolve = resolve, p.$reject = reject;
    function fire() { p.$fire(); }
    function resolve(val) {
      if (p.$state) return;
      if (val && val.then) return val.then(resolve, reject);
      p.$state = STATE_RESOLVED, p.$value = val;
      nextTick(fire); }
    function reject(err) {
      if (p.$state)
        return console.info(COLOR_OK + p + COLOR_NORMAL),
               console.error('%sUnhandled 2nd rejection %s%s', COLOR_ERROR, err2str(err), COLOR_NORMAL);
      p.$state = STATE_REJECTED, p.$value = err;
      nextTick(fire); }
  }

  // Promise#then(res, rej)
  MiniPromise.prototype.then = function then(res, rej) {
    var p = this, q = new MiniPromise();
    p.$callbacks.push([q, res, rej]);
    if (p.$state) nextTick(p.$$fire);
    return q;
  };

  // Promise#catch(rej)
  MiniPromise.prototype['catch'] = function caught(rej) {
    //return this.then(undefined, rej);
    var p = this, q = new MiniPromise();
    p.$callbacks.push([q, undefined, rej]);
    if (p.$state) nextTick(p.$$fire);
    return q;
  };

  // Promise#$fire()
  MiniPromise.prototype.$fire = function $fire() {
    var p = this, i = p.$state, v = p.$value, o;
    if (!i) return;
    while(o = p.$callbacks.shift())
      (function (b, q, r) {
        if (b)
          try {
            p.$handled = true;
            r = b(v);
            if (r && typeof r.then === 'function')
              r.then(q.$resolve, q.$reject);
            else q.$resolve(r);
          } catch (e) { q.$reject(e); }
        else if (i === STATE_REJECTED)
          p.$handled = true, q.$reject(v);
        else
          q.$resolve();
      })(o[i], o[0]);
    if (i === STATE_REJECTED && !p.$handled && !p.$handledRejection)
      nextTick(function () {
        if (!p.$handled) {
          p.$handledRejection = true;
          console.info(COLOR_OK + p + COLOR_NORMAL);
          console.error('%sUnhandled rejection %s%s', COLOR_ERROR, err2str(v), COLOR_NORMAL);
        }
      });
    if (p.$handled && p.$handledRejection) {
      p.$handledRejection = false;
      console.info(COLOR_OK + p + COLOR_NORMAL);
      console.error('%sUnhandled rejection handled.%s', COLOR_ERROR, COLOR_NORMAL);
    }
  };

  // Promise#toString()
  setValue(MiniPromise.prototype, 'toString', toString);
  function toString() {
    return 'MiniPromise { ' + (
      this.$state === STATE_UNRESOLVED ? '<pending>' :
      this.$state === STATE_RESOLVED ? JSON.stringify(this.$value) :
      '<rejected> ' + this.$value) + ' }';
  } // toString

  // Promise.resolve(val)
  setValue(MiniPromise, 'resolve', function resolve(val) {
    return new MiniPromise(function (resolve, reject) { resolve(val); }); });

  // Promise.reject(err)
  setValue(MiniPromise, 'reject', function reject(err) {
    return new MiniPromise(function (resolve, reject) { reject(err); }); });

  // Promise.all([p, ...])
  setValue(MiniPromise, 'all', function all(promises) {
    if (isIterator(promises)) promises = makeArrayFromIterator(promises);
    if (!(promises instanceof Array))
      throw new TypeError('promises must be an array');
    return new MiniPromise(
      function promiseAll(resolve, reject) {
        var n = promises.length;
        if (n === 0) return resolve([]);
        var res = Array(n);
        promises.forEach(function (p, i) {
          function complete(val) {
            res[i] = val; if (--n === 0) resolve(res); }
          if (p instanceof MiniPromise || isPromise(p))
            return p.then(complete, reject);
          complete(p);
        }); // promises.forEach
      }
    ); // return new Promise
  }); // all

  // Promise.race([p, ...])
  setValue(MiniPromise, 'race', function race(promises) {
    if (isIterator(promises)) promises = makeArrayFromIterator(promises);
    if (!(promises instanceof Array))
      throw new TypeError('promises must be an array');
    return new MiniPromise(
      function promiseRace(resolve, reject) {
        promises.forEach(function (p) {
          if (p instanceof MiniPromise || isPromise(p))
            return p.then(resolve, reject);
          resolve(p);
        }); // promises.forEach
      }
    ); // return new Promise
  }); // race

  // isPromise(p)
  setValue(MiniPromise, 'isPromise', isPromise);
  function isPromise(p) {
    return !!p && typeof p.then === 'function';
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

  // Promise.accept(val)
  setValue(MiniPromise, 'accept', MiniPromise.resolve);

  // Promise.defer()
  setValue(MiniPromise, 'defer', function defer() {
    var resolve, reject;
    var p = new MiniPromise(function (res, rej) { resolve = res; reject = rej; });
    return {promise: p, resolve: resolve, reject: reject};
  });

  function err2str(err) {
    var msg = err.stack || (err + '');
    return msg.split('\n').filter(filterExcludeMocha).join('\n');
  }

  function filterExcludeMocha(s) {
    return !s.match(/node_modules.*mocha/);
  }

  //setValue(MiniPromise, 'MiniPromise', MiniPromise);
  setValue(MiniPromise, 'nextTick', nextTick);

  if (typeof module === 'object' && module && module.exports)
    module.exports = MiniPromise;

  return MiniPromise;

}();
