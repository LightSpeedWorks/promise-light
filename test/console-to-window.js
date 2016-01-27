(function (global) {
	'use strict';

	var methods = ['log', 'info', 'debug', 'warn', 'error'];

	var styles = {
		log:   {color: 'black'},
		info:  {color: 'green'},
		debug: {color: 'blue'},
		warn:  {color: 'brown'},
		error: {color: 'red'},
		time:  {color: 'blue'},
		dir:   {color: 'black'},
		trace: {color: 'black'}};

	if (typeof console === 'undefined') global.console = {};

	var $consoleToWindow = document.createElement('pre');

	var parent, ignore = 0;

	console.mount = function (element) {
		if (!element) element = document.body;
		if (!element) {
			// element and document.body are undefined
			window.onload = function (onload) {
				return function () {
					console.mount(parent);
					if (onload) onload();
				};
			} (window.onload);
			return;
		}
		if (element === parent) return parent;
		if (parent) parent.removeChild($consoleToWindow);
		parent = element;
		parent.appendChild($consoleToWindow);
		return parent;
	};

	console.setStyle = function (method, style) {
		styles[method] = style;
	};

	console.mount();

	function pr() {
		//if (ignore) return;
		var ctx = this || 'log';
		var div = document.createElement('div');
		for (var i in styles[ctx])
			div.style[i] = styles[ctx][i];
		var msg = ctx + ': ' + [].slice.call(arguments).join(' ');

		if (typeof div.textContent === 'string')
			div.textContent = msg;
		else
			div.innerText = msg;

		$consoleToWindow.appendChild(div);
	}

	for (var i in methods)
		console[methods[i]] = function (method, fn) {
			return function () {
				applyFunc(fn, this, arguments);
				pr.apply(method, arguments);
			};
		} (methods[i], console[methods[i]]);

	var timerNames = {};

	// console.time(timerName)
	console.time = function (fn) {
		return function (timerName) {
			applyFunc(fn, this, arguments);
			timerNames[timerName] = new Date - 0;
		};
	} (console.time);

	// console.timeEnd(timerName)
	console.timeEnd = function (fn) {
		return function (timerName) {
			applyFunc(fn, this, arguments);
			pr.call('time', timerName + ':', (new Date - timerNames[timerName]) + 'ms');
		};
	} (console.timeEnd);

	// console.dir(obj)
	console.dir = function (fn) {
		return function (obj) {
			applyFunc(fn, this, arguments);
			pr.call('dir', JSON.stringify(obj));
		};
	} (console.dir);

	// console.trace()
	console.trace = function (fn) {
		return function (obj) {
			applyFunc(fn, this, arguments);
			var err = new Error();
			var msg = err.message || err.description || '';
			if (err.stack) msg += ': ' + err.stack;
			if (err.fileName) msg += ': ' + err.fileName + '@' + err.lineNumber + ',' + err.columnNumber;
			arguments[arguments.length++] = msg;
			pr.apply('trace', arguments);
		};
	} (console.trace);

	function applyFunc(fn, ctx, args) {
		++ignore;
		if (typeof fn === 'function')
			fn.apply(ctx, args);
		--ignore;
	}

})(Function('return this')());
