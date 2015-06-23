// assert.js

this.assert = function ($debug, $print) {
  'use strict';

  var c = $print || (typeof console ? console : {error: function () {}});

  function assert(bool, msg) {
    if (bool) return;
    c.error(msg);
    throw new Error(msg);
  }

  assert.equal = function equal(act, exp, msg) {
    if (act === exp) return;
    if (!msg) msg = act + ' !== ' + exp;
    assert(act === exp, msg);
  };

  var getKeys = Object.getOwnPropertyNames ? Object.getOwnPropertyNames : Object.keys;

  assert.deepEqual = function deepEqual(act, exp, msg) {
    if (act === exp) return;
    if (!msg) msg = act + ' !== ' + exp;
    assert(typeof act === typeof exp, msg);
    if (typeof act !== 'object') assert(false, msg);

    // object
    assert(act !== null && exp !== null, msg);
    assert(act.constructor === exp.constructor, msg);
    if (act instanceof Array) {
      assert(act.length === exp.length, msg);
      for (var i = 0, n = act.length; i < n; ++i)
        assert.deepEqual(act[i], exp[i], msg);
    }
    else {
      var keys = getKeys(act);
      assert(keys.sort().join(',') === getKeys(exp).sort().join(','), msg);
      for (var i = 0, n = keys.length; i < n; ++i)
        assert.deepEqual(act[keys[i]], exp[keys[i]], msg);
    }
  };

  if (typeof module === 'object' && module && module.exports)
    module.exports = assert;

  return assert;

}(typeof $debug !== 'undefined' ? $debug : false,
  typeof $print === 'function' ? $print : require('./print'));
