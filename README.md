promise-light
====


Promise Specification
----

### new Promise(setup)

```js
p = new Promise(
	function setup(
		function resolve(result) {},
		function reject(err) {}
	) {}
);
```

### promise.then

```js
p = p.then(
	function resolve(result) {},
	function reject(err) {});
	= p.chain(?)  same as then *non-standard
```

### promise.catch

```js
p = p.catch(
function reject(err) {});
```

### defer

```js
? = Promise.defer(?); *non-standard
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
p = Promise.accept(result); *non-standard
```
