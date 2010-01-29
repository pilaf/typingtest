TypingTest = {
	init: function() {
		['box', 'keycode', 'cursor', 'speedometer', 'testbox'].each(function(v) { TypingTest[v] = $(v) })
		this.box.insertBefore(document.createTextNode(''), this.cursor);
		
		$('clear').onclick = function() {
			TypingTest.clear();
			return false;
		};
		
		$('play').onclick = function() {
			if (TypingTest.playing) {
				TypingTest.stop();
				this.innerHTML = 'play';
			} else {
				var play = this;
				if (TypingTest.play(TypingTest.record, {onFinish: function() { play.innerHTML = 'play' }})) {
					this.innerHTML = 'stop';
				}
			}
			return false;
		}
		
		$('record').onclick = function() {
			this.innerHTML = TypingTest.toggleRecord() ? 'stop' : 'record';
			return false;
		}
		
		$('save').onclick = function() {
			with (Element) {
				document.body.appendChild(build('div', {'class': 'message'}, [
					build('a', {
						href: '#',
						'class': 'close',
						onclick: 'this.parentNode.parentNode.removeChild(this.parentNode); return false;'
					}, ['close']),
					build('div', {'class': 'info'}, [TypingTest.record.toJSON()])
				]));
			}
			return false;
		}
		
		$('load').onclick = function() {
			r = prompt('Paste typing recording here:');
			if (r == null) return false;
			if (!TypingTest.loadJSON(r)) {
				alert('Invalid record format!');
			}
			return false;
		}
		
		$('test').onclick = function() {
			this.innerHTML = TypingTest.toggleTest() ? 'stop' : 'test';
			return false;
		}
		
		if (window.attachEvent && !window.opera) {
			document.onkeydown = function() {
				if (event.keyCode == 8) {
					TypingTest.keyStroke(8);
					return false;
				}
			}
		}

		document.onkeypress = function(e) {
			e = e || event;
			if (!e.ctrlKey) {
				var k = (e.charCode != undefined) ? e.charCode : e.keyCode;
				TypingTest.keyStroke(e.keyCode == 8 ? 8 : k)
				return false;
			}
		}
		
		setInterval(function() { TypingTest.cursor.toggleStyle('visibility', 'visible', 'hidden') }, 800);
		
		this.playing = this.testing = this.recording = false;
		this.speedCount = this.charcount = this.typos = 0;
		
		setInterval(function() {
			//speedometer.innerHTML = TypingTest.speedCount;
			TypingTest.speedometer.style.backgroundPosition = '-' + (TypingTest.speedCount * 100) + 'px'
			TypingTest.speedCount = 0;
		}, 200);
		
		this.record = [[889, 87], [153, 101], [56, 108], [111, 99], [63, 111], [156, 109], [57, 101], [90, 32], [108, 116], [46, 111], [57, 32], [382, 112], [30, 105], [192, 108], [94, 97], [50, 102], [162, 39], [118, 115], [90, 32], [833, 116], [184, 121], [56, 112], [181, 105], [168, 110], [36, 103], [81, 32], [97, 116], [54, 101], [148, 115], [132, 116], [91, 32], [174, 97], [54, 112], [123, 112], [157, 46]];
		
		$('play').onclick();
	},
	
	clear: function() {
		var n;
		while ((n = this.box.firstChild) != this.cursor) {
			n.timeout && clearTimeout(n.timeout);
			this.box.removeChild(n);
		}
		this.box.insertBefore(document.createTextNode(''), this.cursor);
		this.charcount = 0;
		this.typos = 0;
	},
	
	keyStroke: function(key) {
		if (!key) return;
		//this.keycode.innerHTML = key;
		if (key == 8) this.erase(); else this.insert(key);
	},
	
	insert: function(key) {
		if (key != 32 || this.lastKey != 32) {
			var c = String.fromCharCode(key);
			var e = Element.build('span').append(c);
			
			if (this.testing && (this.typos || c != this.test.charAt(this.charcount))) {
				this.typos++;
				e.className = 'typo';
			} else {
				e.className = 'char';
				e.timeout = setTimeout(function() { TypingTest.box.firstChild.data += TypingTest.box.removeChild(e).firstChild.data }, 200);
				this.testing && this.splitTestBoxAt(this.charcount + 1);
			}
			
			this.box.insertBefore(e, this.cursor);
			this.recordKey(key);
			this.lastKey = key;
			this.scrollToBottom();
			this.speedCount++;
			this.charcount++;
			
			if (this.testing && !this.testStarted) {
				this.testStarted = true;
				this.testStart = (new Date).getTime();
			}
			
			if (this.testing && this.charcount == this.test.length && !this.typos) {
				var chars = this.test.length;
				var words = chars / 5;
				var time = ((new Date).getTime() - this.testStart) / 1000;
				var wpm = Math.round(60 * words / time);
				alert("You finished in " + Math.round(time) + " seconds!\nYour typing speed is " + wpm + " WPM.");
				this.toggleTest();
			}
		}
	},
	
	erase: function() {
		if (!this.charcount) return;
		this.testing && this.splitTestBoxAt(this.charcount - 1);
		var e = this.cursor.previousSibling;
		if (e.nodeType == 1) {
			var l = e.firstChild.data;
			e.timeout && clearTimeout(e.timeout);
			this.box.removeChild(e);
		} else {
			var l = e.data.lastChar();
			this.box.replaceChild(document.createTextNode(e.data.substring(0, e.data.length - 1)), this.box.firstChild);
		}
		this.box.insertAfter(e = Element.build('span').append(l).addClass('erased'), this.cursor);
		setTimeout(function() { TypingTest.box.removeChild(e) }, 200);
		this.recordKey(8);
		this.lastKey = 8;
		this.scrollToBottom();
		this.typos && this.typos--;
		this.charcount--;
	},
	
	splitTestBoxAt: function(i) {
		this.testbox.firstChild.replaceChild(document.createTextNode(i == 0 ? '' : this.test.substr(0, i)), this.testbox.firstChild.firstChild);
		this.testbox.replaceChild(document.createTextNode(i == this.test.length ? '' : this.test.substring(i, this.test.length)), this.testbox.childNodes[1]);
	},
	
	recordKey: function(key) {
		if (this.recording) {
			var t = (new Date).getTime();
			this.record.push([t - this.lastRecordTime, key]);
			this.lastRecordTime = t;
		}
	},
	
	scrollToBottom: function() {
		this.box.scrollTop = this.box.scrollHeight;
	},
	
	play: function(stream, options) {
		if (!stream.length || this.recording) return false;
		options = options || {};
		this.playing = true;
		var i = 0;
		(function() {
			if (TypingTest.playing) {
				TypingTest.keyStroke(stream[i++][1]);
				if (i < stream.length) setTimeout(arguments.callee, stream[i][0] / (options.speed || 1));
				else {
					TypingTest.playing = false;
					options.onFinish && options.onFinish();
				}
			}
		})()
		return true;
	},
	
	stop: function() {
		this.playing = false;
	},
	
	toggleRecord: function() {
		if (this.recording || this.playing) {
			return this.recording = false;
		} else {
			this.record = [];
			this.lastRecordTime = (new Date).getTime()
			return this.recording = true;
		}
	},
	
	loadJSON: function(json) {
		if ((/^\s*\[\s*\[\s*\d+(?:\.\d+)?\s*,\s*\d+\s*\]\s*(?:,\s*\[\s*\d+(?:\.\d+)?\s*,\s*\d+\s*\])*\s*\]\s*$/.test(json))) {
			this.record = evalJSON(json);
			return true;
		}
		return false;
	},
	
	toggleTest: function() {
		this.testing = !this.testing;
		if (this.testing) {
			this.resetTestBox();
			this.stop();
			this.clear();
			this.testStarted = false;
		}
		this.testbox[this.testing ? 'show' : 'hide']();
		return this.testing;
	},
	
	setTest: function(test) {
		this.test = test.replace("\n", ' ').replace(/\s\s+/, ' ').replace(/^\s/, '').replace(/\s$/, '');
	},
	
	resetTestBox: function() {
		var t = Element.build('div', {id: 'testbox'/*, style: 'display: none'*/}, [Element.build('span').append(''), this.test]);
		this.testbox.replace(t);
		this.testbox = t;
	}
};