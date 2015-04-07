promise-light
====


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
	= p.chain(?)  same as then *non-standard
```

### promise.catch

```js
p = p.catch(
  function reject(err) {});
```

### // defer - not yet implementation

```js
// ? = Promise.defer(?); *non-standard
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
