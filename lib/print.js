this.$print = function (g, w, d, c) {
  'use strict';

  var msgs = [], isLoaded = !w;
  var slice = [].slice;
  var tags = {
    log:   ['<font color=green>',  '</font>'],
    info:  ['<font color=blue>',   '</font>'],
    warn:  ['<font color=orange>', '</font>'],
    error: ['<font color=red>',    '</font>'],
    print: ['',  '']
  };

  // printAll()
  function printAll() {
    var msg, div, tag;
    while (msg = msgs.shift()) {
      tag = msg.tag;
      msg = msg.msg;
      if (c) c[tag] ? c[tag](msg) : c.log(msg);
      if (d) {
        (div = d.createElement('div')).innerHTML =
          tags[tag][0] + msg + tags[tag][1];
        d.body.appendChild(div);
      }
    }
  }

  // print(...msgs)
  function print() {
    msgs.push({tag:'print', msg:slice.call(arguments).join(' ')});
    if (isLoaded) printAll();
  }

  // onload()
  if (w) g.onload = function (onload) {
    return function () {
      if (onload) onload();
      isLoaded = true;
      printAll();
    };
  }(g.onload);

  function generatePrint(tag) {
    return function print() {
      msgs.push({tag:tag, msg:slice.call(arguments).join(' ')});
      if (isLoaded) printAll();
    };
  }

  print.log = generatePrint('log');
  print.info = generatePrint('info');
  print.warn = generatePrint('warn');
  print.error = generatePrint('error');

  print.$print = print;
  print.print = print;

  if (typeof module === 'object' && module && module.exports)
    module.exports = print;

  return print;
}(Function('return this')(),
  typeof window   !== 'undefined' ? window   : undefined,
  typeof document !== 'undefined' ? document : undefined,
  typeof console  !== 'undefined' ? console  : undefined);

this.console = typeof console !== 'undefined' ? console : this.$print;
