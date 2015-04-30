// assert.js

this.assert = function () {
  'use strict';

  function assert(bool, msg) {
    if (bool) return;
    console.error(msg);
    throw new Error(msg);
  }

  assert.equal = function equal(act, exp, msg) {
    assert(act === exp, msg);
  };

  var getKeys = Object.getOwnPropertyNames ? Object.getOwnPropertyNames : Object.keys;

  assert.deepEqual = function deepEqual(act, exp, msg) {
    if (act === exp) return;
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

}();
