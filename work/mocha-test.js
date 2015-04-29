(function () {
  'use strict';

  var util = require('util');

  function ins(x) {
    return util.inspect(x, {colors:true}); }

  describe('describe1', function () {
    it('it1', function () {
    }); // it1

    it('it2', function (fn) {
      setTimeout(fn, 55);
    }); // it2

    it('it3', function () {
      return {then: function (res, rej) {
        setTimeout(res, 40);
        }};
    }); // it3

    it('it4', function () {
      var resolve;
      setTimeout(function () { resolve(); }, 40);
      return {then: function (res, rej) {
        resolve = res;
        }};
    }); // it4

  });

})();
