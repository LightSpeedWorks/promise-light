void function () {
	'use strict';

	var setProto = Object.setPrototypeOf ||
			function setProto(obj, proto) { obj.__proto__ = proto; };

	// extend-light
	function extend(name, proto, statics) {
		'use strict';
		if (typeof name !== 'string') statics = proto, proto = name;
		proto = proto || {};
		var super_ = typeof this === 'function' ? this : undefined;

		var ctor = proto.hasOwnProperty('constructor') ? proto.constructor :
			super_ ? function () {
				if (!(this instanceof ctor)) return ctor.apply(new $ctor(), arguments);
				super_.apply(this, arguments); return this; } :
			function () { if (!(this instanceof ctor)) return new ctor(); };
 
		function $super() { this.constructor = ctor; }
		if (super_) $super.prototype = super_.prototype;
		function $ctor() {}
		$ctor.prototype = ctor.prototype = merge(new $super(), proto);
		delete ctor.prototype.statics;

		if (super_) setProto(ctor, super_);
		if (typeof name === 'string') try { ctor.name = name; } catch (e) {} // for old IE
		return merge(ctor, proto.statics, statics,
			super_ ? {super_: super_} : undefined, super_, {extend: extend, create: create});
	}

	// create
	function create() {
		function $ctor() {}
		$ctor.prototype = this.prototype;
		return this.apply(new $ctor(), arguments);
	}

	// merge-light
	function merge(dst, src) {
		for (var i = 1; src = arguments[i], i < arguments.length; ++i)
			for (var p in src)
				if (src.hasOwnProperty(p) && !dst.hasOwnProperty(p) &&
						dst[p] !== src[p]) dst[p] = src[p];
		return dst;
	}

	if (typeof module === 'object' && module && module.exports)
		module.exports = extend;

	Function('return this')()['extend-light'] = extend;
}();
