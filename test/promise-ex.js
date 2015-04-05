// STATE
var STATE = {UNRESOLVED: 'unresolved', RESOLVED: 'resolved', REJECTED: 'rejected'};

// Promise プロミス/約束
function Promise(setup) {
  var state = STATE.UNRESOLVED;
  var bombs = [];
  var result;
  var ctx;

  // resolve(res) 解決
  function resolve() {
    if (!result) result = arguments;
    if (state === STATE.UNRESOLVED)
      state = STATE.RESOLVED;
    fire(ctx);
  } // resolve

  // reject(err) 拒否
  function reject() {
    if (!result) result = arguments;
    if (state === STATE.UNRESOLVED)
      state = STATE.REJECTED;
    fire(ctx);
  } // reject

  // then
  this.then = then;
  function then(resolved, rejected) {
    var dfd;
    var pr = new Promise(function (resolve, reject) {
      dfd = {resolve:resolve, reject:reject};
    });
    bombs.push({cb:resolved, eb:rejected, called:false, dfd:dfd});
    if (state !== STATE.UNRESOLVED) fire(ctx);
    return pr;
  } // then

  // fire
  function fire(ctx) {
    if (state === STATE.UNRESOLVED)
      throw new Error('BUG: state is invalid');

    bombs.forEach(function (bomb) {
      if (bomb.called) return;
      bomb.called = true;
      var pr;
      if (state === STATE.RESOLVED) {
        if (bomb.cb) pr = bomb.cb.apply(ctx, result);
        if (bomb.dfd && pr && pr.then) {
          pr.then(function () {
            return bomb.dfd.resolve.apply(ctx, arguments);
          }, function () {
            return bomb.dfd.reject.apply(ctx, arguments);
          });
        } else if (bomb.dfd)
            bomb.dfd.resolve.call(ctx, pr);
      } else { // REJECTED
        if (bomb.eb) pr = bomb.eb.apply(ctx, result);
        if (bomb.dfd && pr && pr.then) {
          pr.then(function () {
            return bomb.dfd.reject.apply(ctx, arguments);
          }, function () {
            return bomb.dfd.reject.apply(ctx, arguments);
          });
        } else if (bomb.dfd)
            bomb.dfd.reject.call(ctx, pr);
      }
    }); // bombs.forEach
  } // fire

  if (setup && typeof setup === 'function')
    setup(resolve, reject);
  else { // public promise
    this.resolve = resolve;
    this.reject  = reject;
  }

} // Promise

  // Promise done
  Promise.prototype.done = function Promise_done(resolved) {
    return this.then(resolved);
  } // done

  // Promise catch
  Promise.prototype.catch = function Promise_catch(rejected) {
    return this.then(undefined, rejected);
  } // catch

  // Promise error
  Promise.prototype.error = function Promise_error(rejected) {
    return this.then(undefined, rejected);
  } // error

  // Promise fail
  Promise.prototype.fail = function Promise_fail(rejected) {
    return this.then(undefined, rejected);
  } // fail

  var slice = Array.prototype.slice;
  // Promise.when
  Promise.when = when;
  function when() {
    var dfd, ctx;
    var pr = new Promise(function (resolve, reject) {
      dfd = {resolve:resolve, reject:reject};
    });
    var result = new Array(arguments.length);
    var args = slice.call(arguments);
    var n = 0;
    if (args.length === 0) dfd.resolve.apply(ctx, result);
    args.forEach(function (pr, i) {
      if (pr && pr.then) {
        ++n;
        pr.then(function (res) {
          result[i] = res;
          if (--n === 0) dfd.resolve.apply(ctx, result);
        }, function (err) {
          result[i] = err;
          n = 0;
          dfd.reject.apply(ctx, result);
        });
      } else {
        result[i] = pr;
      }
    });
    return pr;
  } // when

// test テスト
var no = 0;

// timer
function timer(ms) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () { resolve(++no); }, ms)  // msミリ秒後にこのpromiseを解決する
  });
} // timer

// timer2
function timer2(ms) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () { reject(new Error('err ' + ++no)); }, ms)  // msミリ秒後にこのpromiseを解決する
  });
} // timer2

function timer3(ms) {
  return Math.random() > 0.5 ? timer(ms) : timer2(ms);
}

// main メイン
console.log('start');
timer3(500).then(function (res) {
  console.log('ok 1st', res);
  return timer3(500);
}, function (err) {
  console.log('ng 1st', err);
  return err;
}).then(function (res) {
  console.log('ok 2nd', res);
  return timer3(500);
}, function (err) {
  console.log('ng 2nd', err);
  return err;
}).then(function (res) {
  console.log('ok 3rd', res);
  return timer3(500);
}, function (err) {
  console.log('ng 3rd', err);
  return err;
}).catch(function (err) {
  console.log('ng all', err);
});

Promise.when(timer3(3100), timer3(3200), timer3(3300))
.then(function (a1, a2, a3) {
  console.log('ok when', a1, a2, a3);
}, function (a1, a2, a3) {
  console.log('ng when', a1, a2, a3);
});
