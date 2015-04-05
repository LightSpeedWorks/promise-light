
  switch (process.argv[2]) {
    case '1':
      console.log('*** ../lib/promise-light');
      global.Promise = require('../lib/promise-light');
      break;
    case '2':
      console.log('*** light-promise');
      global.Promise = require('light-promise');
      break;
    default:
      console.log('*** standard Promise');
      break;
  }

  // test テスト
  var no = 0;

  // timer
  // msミリ秒後にこのpromiseを解決する
  function timer(ms) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { resolve(++no); }, ms);
    });
  } // timer

  // timer2
  // msミリ秒後にこのpromiseを拒否する
  function timer2(ms) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { reject(new Error('err ' + ++no)); }, ms);
    });
  } // timer2

  // timer3
  // msミリ秒後にこのpromiseを解決または拒否する
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
    return 'ng 1st';
  }).then(function (res) {
    console.log('ok 2nd', res);
    return timer3(500);
  }, function (err) {
    console.log('ng 2nd', err);
    return 'ng 2nd';
  }).then(function (res) {
    console.log('ok 3rd', res);
    return timer3(500);
  }, function (err) {
    console.log('ng 3rd', err);
    return 'ng 3rd';
  }).catch(function (err) {
    console.log('ng last', err);
  }).then(function() {
    console.log('final');
  });

  Promise.resolve('ok').then(function (x) { console.log('ok', x); });
  Promise.reject(new Error('ng')).then(null, function (x) { console.log('ng', x); });

  Promise.all([timer3(3100), timer3(3200), timer3(3300)])
  .then(function (res) {
    console.log('ok all', res);
  }, function (res) {
    console.log('ng all', res);
  }); // all

  Promise.race([timer3(3100), timer3(3200), timer3(3300)])
  .then(function (res) {
    console.log('ok race', res);
  }, function (res) {
    console.log('ng race', res);
  });  // race

  Promise.all([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)])
  .then(function (results) {
      console.log(results);  // [1, 2, 3]
  }); // all

  Promise.race([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)])
  .then(function (result) {
      console.log(result);  // 1
  }); // race

  Promise.all([Promise.resolve(11), 22, Promise.resolve(33)])
  .then(function (results) {
      console.log(results);  // [11, 22, 33]
  }); // all

  Promise.race([Promise.resolve(11), 22, Promise.resolve(33)])
  .then(function (results) {
      console.log(results);  // 11
  }); // race

  Promise.all([])
  .then(function (results) {
      console.log('all []', results);  // []
  }, function (error) {
      console.log('all []', error);  // []
  }); // all

  Promise.race([])
  .then(function (results) {
      console.log('race []', results);  // undefined?
  }, function (error) {
      console.log('race []', error);  // undefined?
  }); // race

