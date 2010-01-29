A = Array.prototype;

function extend(dest, src) {
	for (var p in src) dest[p] = src[p];
	return dest;
}

function evalJSON(json) {
	return eval('(' + json + ')');
}

function $(element) {
	element = (typeof element == 'string') ? document.getElementById(element) : element;
	if (!element.__extended) extend(element, Element.Extension).__extended = true;
	return element;
}

function map(obj, iterator, context) {
	var r = [];
	context = context || obj;
	if (typeof iterator == 'string') for (var p in obj) r.push(obj[p][iterator]());
	else for (var p in obj) r.push(iterator.call(context, obj[p], p));
	return r;
}

function arrify(obj) { A.slice.call(obj) }

function parseURL(url) {
	var m;
	if (m = url.match(/^([a-z]+:)\/\/(([a-z0-9.-]+):?((?:\d+)?))((?:\/[^?]+)?)((?:[^#]+)?)((?:#.*)?)$/))
		return {href: m[0], protocol: m[1], host: m[2], hostname: m[3], port: m[4], pathname: m[5], search: m[6], hash: m[7]}
	else return {};
}

function parseQueryString(s) {
	s = s || location.search;
	var r = {};
	s.replace(/^[^?]*\?/, '').split('&').without('').each(function(a) {
		a = a.split('=');
		r[a[0]] = decodeURIComponent(a[1]);
	});
	return r;
}

function toJSON(obj) {
	return obj.toJSON ? obj.toJSON() : '{' + map(obj, function(o, k) { return "'" + k.replace("'", "\\'") + "':" + toJSON(o) }).join(',') + '}';
}

extend(Function.prototype, {
	curry: function() {
		var a = arrify(arguments), f = this;
		return function() { return f.apply(this, a.concat(arrify(arguments))) }
	},
	
	bind: function(object) {
		var f = this; return function() { return f.apply(object, arguments); }
	},
	
	toChainedIterator: function() {
		var f = this;
		return function() {
		for (var i = 0; i < arguments.length; i++) f.call(this, arguments[i]);
		return this;
		}
	},
	
	defer: function(delay) {
		return setTimeout(this, delay || 0);
	}
});

A.indexOf || (A.indexOf = function(item) {
	var i = this.length;
	while (i--) if (this[i] == item) return i;
	return -1;
});

extend(A, {
	each: function(iterator, context) {
		context = context || this;
		var l = this.length;
		for (var i = 0; i < l; i++) if (iterator.call(context, this[i], i) !== undefined) break;
	},
	
	invoke: function(fname) {
		var i = this.length;
		while (i--) this[i][fname]();
	},
	
	find: function(iterator, context) {
		context = context || this;
		var i = this.length;
		while (i--) if (iterator.call(context, this[i], i)) return this[i];
	},
	
	include: function(item) {
		var i = this.length;
		while (i--) if (this[i] == item) return true;
		return false;
	},
	
	/*
	collect: function(property) {
		var r = [], i = this.length;
		while (i--) r.unshift(this[i][property]);
		return r;
	},
	*/
	
	map: function(iterator, context) {
		var r = [], i = this.length;
		if (typeof iterator == 'string') while (i--) try {
		r.unshift(this[i][iterator]())
		} catch(e) {
		r.unshift(this[i][iterator])
		} else {
		context = context || this;
		while (i--) r.unshift(iterator.call(context, this[i], i));
		}
		return r;
	},
	
	without: function(item) {
		var i = A.indexOf.call(this, item);
		if (i > -1) A.splice.call(this, i, 1);
		return this;
	},
	
	groupBy: function(criteria) {
		var values = [], groups = [];
		var v, o;
		for (var i = 0; i < this.length; i++) {
		v = criteria(this[i]);
		o = values.indexOf(v);
		if (o == -1) {
			values.push(v);
			groups.push([this[i]]);
		} else groups[o].push(this[i]);
		}
		return groups;
	},
	
	last: function() { if (this.length) return this[this.length - 1] },
	toJSON: function() { return '[' + this.map(toJSON).join(', ') + ']' }
});

extend(String.prototype, {
	toJSON: function() { return "'" + this.replace("'", "\\'") +  "'" },
	lastChar: function() { return this.charAt(this.length - 1) }
});

[Number, Boolean, RegExp, Function].each(function(o) {o.prototype.toJSON = o.prototype.toString});

if (!window.Element) Element = {};

Element.build = function() {
	var e = $(document.createElement(arguments[0]));
	if (arguments[1]) e.set(arguments[1]);
	if (arguments[2]) e.append.apply(e, arguments[2]);
	return e;
}

Element.Extension = {
	/*
	registerEvent: function(event, handler) {
		var element = this;
		this.attachEvent('on' + event, function(event) {
		event.target = event.srcElement;
		event.stopPropagation = function() { event.cancelBubble = true };
		event.preventDefault = function() { event.returnValue = false };
		handler.call(element, event);
		});
	},
	*/
	
	hasClass: function(className) {
		return (new RegExp('\\b' + className + '\\b')).test(this.className);
	},
	
	addClass: function(className) {
		if (!this.hasClass(className)) this.className += ' ' + className;
		return this;
	},
	
	removeClass: function(className) {
		this.className = this.className.replace(new RegExp('\\b' + className + '\\b'), '');
		return this;
	},
	
	set: (function(attr) { for (var a in attr) this.setAttribute(a, attr[a]) }).toChainedIterator(),
	
	append: (function(e) {
		this.appendChild((typeof e == 'string') ? document.createTextNode(e) : e);
	}).toChainedIterator(),
	
	insertAfter: function(el, after) {
		this[after.nextSibling ? 'insertBefore' : 'appendChild'](el, after.nextSibling);
		return this;
	},
	
	replace: function(el) { return this.parentNode.replaceChild(el, this) },
	toggleStyle: function(p, v1, v2) { this.style[p] = (this.style[p] == v1) ? v2 : v1; return this },
	show: function() { this.style.display = ''; return this; },
	hide: function() { this.style.display = 'none'; return this; },
	visible: function() { return this.style.display != 'none'; },
	toggle: function() { this[this.visible() ? 'hide' : 'show'](); return this; }
};

Ajax = {
	onStateChange: function(transport, options) {
		if (transport.readyState == 4) {
			options.onComplete && options.onComplete.call(transport);
			if (transport.status >= 200 && transport.status < 300)
				options.onSuccess && options.onSuccess.call(transport);
			else
				options.onFailure && options.onFailure.call(transport);
		}
	},
	
	request: function(url, options) {
		options || (options = {});
		if (options.async === undefined) options.async = true;
		if (!options.method || (options.method != 'get' && options.method != 'post')) {
		options.method = 'get';
		}
	
		var body = null;
	
		if (options.method == 'get' && options.parameters) {
		url += (url.indexOf('?') > -1 ? '&' : '?') + options.parameters;
		} else if (options.method == 'post') {
		body = options.parameters;
		}
	
		var transport = new XMLHttpRequest;
	
		if (options.async) transport.onreadystatechange = function() { Ajax.onStateChange(transport, options) };
	
		transport.open(options.method.toUpperCase(), url, options.async);
		transport.send(body);
	
		if (!options.async) {
		Ajax.onStateChange(transport, options);
		return transport;
		}
	}
};

Fx = {
	base: function(f, options) {
		options = options || {};
		options.duration = options.duration || 1;
		options.transformation = options.transformation || Fx.Transformations.sin;
		options.beforeStart && options.beforeStart();
		var init = (new Date).getTime();
		var i = setInterval(function() {
			var x = ((new Date).getTime() - init) / 1000 / options.duration;
			if (x >= 1) {
			clearInterval(i);
			f(options.transformation(1));
			options.afterFinish && options.afterFinish();
			} else f(options.transformation(x));
		}, options.interval || 50);
	},
	
	Transformations: {
		id: function(x) { return x },
		sin: function(x) { return Math.sin(Math.PI / 2 * x) }
	}
};