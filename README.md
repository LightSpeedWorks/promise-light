[promise-light](https://www.npmjs.org/package/promise-light) - npm
====

  `promise-light` is standard ES6 Promise implementation.<br/>
  it supports browser Chrome, Firefox, ie11, ie9, ie8.<br/>
  also supports node.js/io.js.

# INSTALL:

```bash
$ npm install promise-light --save
```

or

http://lightspeedworks.github.io/promise-light/promise-light.js

```html
<script src="http://lightspeedworks.github.io/promise-light/promise-light.js"></script>
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
  }
);
// setup(
//	function resolve(value) {},
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

### promise.then

how to use promise.

```js
p = p.then(
	function resolved(value) {},
	function rejected(error) {});
```

example

```js
p = p.then(
	function (value) {
    console.info(value);
  },
	function (error) {
    console.error(error);
  });
```

### promise.catch

how to catch error from promise.

```js
p = p.catch(
	function reject(error) {});
```

or

when you use old browser
```js
p = p['catch'](
	function reject(error) {});
```

### Promise.all

wait for all promises.

```js
p = Promise.all([promise, ...]);
```

### Promise.race

get first value or error of finished promise.

```js
p = Promise.race([promise, ...]);
```

### Promise.resolve

get resolved promise.

```js
p = Promise.resolve(value or promise);
```

### Promise.reject

get rejected promise.

```js
p = Promise.reject(error);
```

### Promise.accept

get resolved (accepted) promise.

```js
p = Promise.accept(value);
```

### Promise.defer

make deferred object with promise.

```js
dfd = Promise.defer();
// -> {promise, resolve, reject}
```


# LICENSE:

  MIT
