// next-tick.js

this.nextTick = function () {
  'use strict';

  var nextTick = typeof setImmediate !== 'undefined' ? setImmediate :
    typeof process !== 'undefined' ? process.nextTick :
    function nextTick(fn) { setTimeout(fn, 0); };

  return nextTick;
}();
