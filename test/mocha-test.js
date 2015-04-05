
  var util = require('util');
  function ins(x) {
    return util.inspect(x, {colors:true}); }

  var d1 = describe('describe1', function () {
    var i1 = it('it1', function () {
    });
    console.log('i1: ' + ins(i1));
  });
  console.log('d1: ' + ins(d1));
