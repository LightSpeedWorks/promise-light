// describe-it.js

this.it = null;

this.describe = function ($module, $debug, $print) {
  'use strict';

  var c = $print || (typeof console ? console :
      {info: function () {}, warn: function () {}, error: function () {}});

  var s1 = [];
  var s2;
  function describe(msg1, fn1) {
    s1.push(arguments);
    return true;
  }

  function it(msg2, fn2) {
    s2.push(arguments);
    return true;
  }

  // nextTick(fn)
  var nextTick = typeof setImmediate === 'function' ? setImmediate :
    typeof process === 'object' && process && typeof process.nextTick === 'function' ? process.nextTick :
    function nextTick(fn) { setTimeout(fn, 0); };

  // t1
  nextTick(t1);
  function t1() {
    var args = s1.shift();
    if (!args) return;
    var msg1 = args[0], fn1 = args[1];

    s2 = [];

    try {
      if (typeof fn1 !== 'function') throw new Error('fn1 is not function');
      var p = fn1();
    } catch (err) {
      c.error(msg1, err);
      return nextTick(t1);
    }
    c.info(msg1);

    // t2
    nextTick(t2);
    function t2() {
      var args = s2.shift();
      if (!args) return nextTick(t1);
      var msg2 = ' . . ' + msg1 + ' . . ' + args[0], fn2 = args[1];

      if (args.length === 2) {
        try {
          if (typeof fn2 !== 'function') throw new Error('fn2 is not function');
          var p = fn2();
        } catch (err) {
          c.error(msg2, err);
          return nextTick(t2);
        }
        if (p && p.then)
          return p.then(
            function (val) { val != null ? c.info(msg2, val) : c.info(msg2); nextTick(t2); },
            function (err) { c.error(msg2, err); nextTick(t2); });
        else {
          c.info(msg2);
          return nextTick(t2);
        }
      }
      else {
        c.warn(msg2);
        return nextTick(t2);
      }

    } // t2
  } // t1

  describe.describe = describe;
  describe.it = it;
  $module.it = it;

  if (typeof module === 'object' && module && module.exports)
    module.exports = describe;

  return describe;

}(this,
  typeof $debug !== 'undefined' ? $debug : false,
  typeof $print === 'function' ? $print : require('./print'));
