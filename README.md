[promise-light](https://www.npmjs.org/package/promise-light) - npm
====

  `promise-light` is standard ES6 Promise implementation.

# INSTALL:

```bash
$ npm install promise-light --save
```

or

http://lightspeedworks.github.io/promise-light/promise-light.js

```html
<script src="http://lightspeedworks.github.io/promise-light/promise-light.js"></script>
```

# PREPARATION:

```js
(function (Promise) {
  // you can use Promise
})(this.Promise || require('promise-light'));
```

or

```js
var Promise = Promise || require('promise-light');
```

# USAGE:

Promise Specification
----

### new Promise(setup)

```js
p = new Promise(
	function setup(
		function resolve(val) {},
		function reject(err) {}
	) {}
);
```

### promise.then

```js
p = p.then(
	function resolve(val) {},
	function reject(err) {});
```

### promise.catch

```js
p = p.catch(
	function reject(err) {});
```

### Promise.all

```js
p = Promise.all([promise, ...]);
```

### Promise.race

```js
p = Promise.race([promise, ...]);
```

### Promise.resolve

```js
p = Promise.resolve(result or promise);
```

### Promise.reject

```js
p = Promise.reject(err);
```

### Promise.accept

```js
p = Promise.accept(result);
```

### Promise.defer

```js
dfd = Promise.defer();
// -> {promise, resolve, reject}
```

# LICESE:

  MIT
