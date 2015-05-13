[promise-light](https://www.npmjs.org/package/promise-light) - npm
====

  `promise-light` is standard ES6 Promise implementation.<br/>
  it supports browser Chrome, Firefox, ie11, ie9, ie8. (tested)<br/>
  also supports node.js/io.js.

  it throws unhandled rejection error.

  if you have native Promise then use it.

  (faster than native Promise)

# INSTALL:

for node.js or io.js

```bash
$ npm install promise-light --save
```

or

for browsers

[https://lightspeedworks.github.io/promise-light/promise-light.js](https://lightspeedworks.github.io/promise-light/promise-light.js)

```html
<script src="https://lightspeedworks.github.io/promise-light/promise-light.js"></script>
```

# PREPARE:

you can use Promise. (native Promise or promise-light)

```js
(function (Promise) {
  'use strict';
  // you can use Promise
})(typeof Promise === 'function' ? Promise : require('promise-light'));
```

or

use native Promise or promise-light.

```js
var Promise = this.Promise || require('promise-light');
```

native Promise is overwritten by promise-light.

```js
var Promise = this.PromiseLight || require('promise-light');
```

# USAGE:

Promise Specification
----

### new Promise(setup)

how to make promise.

```js
p = new Promise(
  function setup(resolve, reject) {
    // async process -> resolve(value) or reject(error)
    try { resolve('value'); }
    catch (error) { reject(error); }
  }
);
// setup(
//  function resolve(value) {},
//  function reject(error) {})
```

example

```js
var p = new Promise(
  function setup(resolve, reject) {
    setTimeout(function () {
      if (Math.random() < 0.5) resolve('value');
      else reject(new Error('error'));
    }, 100);
  }
);

p.then(console.info.bind(console),
       console.error.bind(console));
```

### promise.then(onFulfilled, onRejected)

how to use promise.

```js
p = p.then(
  function resolved(value) {},
  function rejected(error) {});
```

example

```js
p = p.then(
  function resolved(value) {
    console.info(value);
  },
  function rejected(error) {
    console.error(error);
  });
```

### promise.catch(onRejected)

how to catch error from promise.

```js
p = p.catch(
  function rejected(error) {});
```

or

when you use old browser
```js
p = p['catch'](
  function rejected(error) {});
```

### Promise.all(iterable or array)

wait for all promises.

```js
p = Promise.all([promise, ...]);
```

### Promise.race(iterable or array)

get value or error of first finished promise.

```js
p = Promise.race([promise, ...]);
```

### Promise.resolve(value or promise)

get resolved promise.

```js
p = Promise.resolve(value or promise);
```

### Promise.reject(error)

get rejected promise.

```js
p = Promise.reject(error);
```

### Promise.accept(value)

get resolved (accepted) promise.

```js
p = Promise.accept(value);
```

### Promise.defer()

make deferred object with promise.

```js
dfd = Promise.defer();
// -> {promise, resolve, reject}
```


# LICENSE:

  MIT
