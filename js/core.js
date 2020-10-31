/* Core
----------------------------------------------------------------------*/

/* Content
----------------------------------------------------------------------
1. Retina
2. IE9 placeholder
3. Polyfills
4. Help functions
5. Classes
6. Main functions
----------------------------------------------------------------------*/

/* Retina
----------------------------------------------------------------------*/
// (function() {
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var root = typeof exports === 'undefined' ? window : exports;
var config = {
	// An option to choose a suffix for 2x images
	retina2ImageSuffix: '@2x',
	retina3ImageSuffix: '@3x',

	// Ensure Content-Type is an image before trying to load @2x image
	// https://github.com/imulus/retinajs/pull/45)
	check_mime_type: true,

	// Resize high-resolution images to original image's pixel dimensions
	// https://github.com/imulus/retinajs/issues/8
	force_original_dimensions: true
};

function Retina() {}

root.Retina = Retina;

Retina.configure = function (options) {
	if (options === null) {
		options = {};
	}

	for (var prop in options) {
		if (options.hasOwnProperty(prop)) {
			config[prop] = options[prop];
		}
	}
};

Retina.init = function (context, pixelRatio) {
	var readyState = document.readyState;
	if (context === null) {
		context = root;
	}

	var onLoadWindow = function onLoadWindow() {
		var images = document.getElementsByTagName('img'),
		    imagesLength = images.length,
		    retinaImages = [],
		    i,
		    image;
		for (i = 0; i < imagesLength; i += 1) {
			image = images[i];
			if (/(\.svg)$/i.test(image.src)) {
				continue;
			}
			if (!!!image.getAttributeNode('data-no-retina')) {
				if (image.src) {
					retinaImages.push(new RetinaImage(image, pixelRatio));
				}
			}
		}
	};

	if (readyState === "complete") {
		onLoadWindow();
	} else {
		context.addEventListener('load', onLoadWindow);
	}
};

Retina.reloadImage = function (block, pixelRatio) {
	if (!block) {
		return false;
	}
	var images = block.getElementsByTagName('img'),
	    imagesLength = images.length,
	    retinaImages = [],
	    i,
	    image;
	for (i = 0; i < imagesLength; i += 1) {
		image = images[i];
		if (/(\.svg)$/i.test(image.src)) {
			continue;
		}
		if (!!!image.getAttributeNode('data-no-retina')) {
			if (image.src) {
				retinaImages.push(new RetinaImage(image, pixelRatio));
			}
		}
	}
};

Retina.isRetina = function () {
	var mediaQuery = '(-webkit-min-device-pixel-ratio: 1.5), (min--moz-device-pixel-ratio: 1.5), (-o-min-device-pixel-ratio: 3/2), (min-resolution: 1.5dppx)';

	if (root.devicePixelRatio >= 3) {
		return 3;
	}

	if (root.devicePixelRatio > 1) {
		return 2;
	}

	if (root.matchMedia && root.matchMedia(mediaQuery).matches) {
		return 2;
	}

	return false;
};

var regexMatch = /\.[\w\?=]+$/;
function suffixReplace(match) {
	return config["retina" + this.pixelRatio + "ImageSuffix"] + match;
}

function RetinaImagePath(path, pixelRatio, at_2x_path) {
	this.path = path || '';
	this.pixelRatio = pixelRatio;

	if (typeof at_2x_path !== 'undefined' && at_2x_path !== null) {
		this.at_2x_path = at_2x_path;
		this.perform_check = false;
	} else {
		if (undefined !== document.createElement) {
			var locationObject = document.createElement('a');
			locationObject.href = this.path;
			locationObject.pathname = locationObject.pathname.replace(regexMatch, suffixReplace.bind(this));
			this.at_2x_path = locationObject.href;
		} else {
			var parts = this.path.split('?');
			parts[0] = parts[0].replace(regexMatch, suffixReplace.bind(this));
			this.at_2x_path = parts.join('?');
		}
		this.perform_check = true;
	}
}

root.RetinaImagePath = RetinaImagePath;

RetinaImagePath.confirmed_paths = [];

RetinaImagePath.prototype.is_external = function () {
	return !!(this.path.match(/^https?\:/i) && !this.path.match('//' + document.domain));
};

RetinaImagePath.prototype.check_2x_variant = function (callback) {
	var httpRequest,
	    that = this,
	    http;
	if (!this.perform_check && typeof this.at_2x_path !== 'undefined' && this.at_2x_path !== null) {
		return callback(true);
	} else if (this.at_2x_path in RetinaImagePath.confirmed_paths) {
		return callback(true);
	} else if (this.is_external()) {
		return callback(false);
	} else {
		httpRequest = function () {
			var lastIndex, path;
			http = new XMLHttpRequest();
			http.open('HEAD', that.at_2x_path);
			http.onreadystatechange = function () {
				// if(http.readyState !== 4){
				//     return callback(false);
				// }
				if (http.status === 0 || http.status >= 200 && http.status <= 399) {
					if (config.check_mime_type) {
						var type = http.getResponseHeader('Content-Type');
						if (type === null || !type.match(/^image/i)) {
							return callback(false);
						}
					}
					RetinaImagePath.confirmed_paths.push(that.at_2x_path);
					return callback(true);
				} else {
					if (that.pixelRatio === 3) {
						that.pixelRatio--;
						lastIndex = that.at_2x_path.lastIndexOf("@3x.");
						path = that.at_2x_path.split("");
						path.splice(lastIndex, 4, "@2x.");
						that.at_2x_path = path.join("");
						return callback(true);
					} else {
						return callback(false);
					}
				}
			};
			http.send();
		};
		httpRequest();
	}
};

function RetinaImage(el, pixelRatio) {
	this.el = el;
	this.path = new RetinaImagePath(this.el.getAttribute('src'), pixelRatio); //this.el.getAttribute('data-at2x')
	var that = this;
	this.path.check_2x_variant(function (hasVariant) {
		if (hasVariant) {
			that.swap();
		}
	});
}

root.RetinaImage = RetinaImage;

RetinaImage.prototype.swap = function (path) {
	if (typeof path === 'undefined') {
		path = this.path.at_2x_path;
	}
	var that = this;
	function load() {
		if (!that.el.complete) {
			setTimeout(load, 5);
		} else {

			if (config.force_original_dimensions) {
				if (that.el.offsetWidth == 0 && that.el.offsetHeight == 0) {
					that.el.setAttribute('width', that.el.naturalWidth);
					that.el.setAttribute('height', that.el.naturalHeight);
				} else {
					that.el.setAttribute('width', that.el.offsetWidth);
					that.el.setAttribute('height', that.el.offsetHeight);
				}
			}

			that.el.setAttribute('src', path);
		}
	}
	load();
};

var isRetina = Retina.isRetina();
// if (isRetina) {
//     Retina.init(root, isRetina);
// }
// })();

/* IE9 placeholder
----------------------------------------------------------------------*/
(function setPlaceHolders() {
	if (document.all && !window.atob || document.all && !document.addEventListener) {
		var input = document.querySelectorAll('input, textarea'); // get all text fields
		var cls = "placeholder"; // set name of the class

		if (input) {
			// if fields found
			for (var i = 0; i < input.length; i++) {
				var t = input[i];
				var txt = t.getAttribute("placeholder");

				if (txt.length > 0) {
					// if placeholder found
					t.className = t.value.length == 0 ? t.className + " " + cls : t.className; // add class
					t.value = t.value.length > 0 ? t.value : txt; // if no value found

					t.onfocus = function () {
						// on focus
						this.className = this.className.replace(cls);
						this.value = this.value == this.getAttribute("placeholder") ? "" : this.value;
					};

					t.onblur = function () {
						// on focus out
						if (this.value.length == 0) {
							this.value = this.getAttribute("placeholder");
							this.className = this.className + " " + cls; // add class
						}
					};
				}
			}
		}
	}
})();

// polyfills
/* ClassList
----------------------------------------------------------------------*/
/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */
if ("document" in self) {
	if (!("classList" in document.createElement("_"))) {
		(function (j) {
			"use strict";if (!("Element" in j)) {
				return;
			}var a = "classList",
			    f = "prototype",
			    m = j.Element[f],
			    b = Object,
			    k = String[f].trim || function () {
				return this.replace(/^\s+|\s+$/g, "");
			},
			    c = Array[f].indexOf || function (q) {
				var p = 0,
				    o = this.length;for (; p < o; p++) {
					if (p in this && this[p] === q) {
						return p;
					}
				}return -1;
			},
			    n = function n(o, p) {
				this.name = o;this.code = DOMException[o];this.message = p;
			},
			    g = function g(p, o) {
				if (o === "") {
					throw new n("SYNTAX_ERR", "An invalid or illegal string was specified");
				}if (/\s/.test(o)) {
					throw new n("INVALID_CHARACTER_ERR", "String contains an invalid character");
				}return c.call(p, o);
			},
			    d = function d(s) {
				var r = k.call(s.getAttribute("class") || ""),
				    q = r ? r.split(/\s+/) : [],
				    p = 0,
				    o = q.length;for (; p < o; p++) {
					this.push(q[p]);
				}this._updateClassName = function () {
					s.setAttribute("class", this.toString());
				};
			},
			    e = d[f] = [],
			    i = function i() {
				return new d(this);
			};n[f] = Error[f];e.item = function (o) {
				return this[o] || null;
			};e.contains = function (o) {
				o += "";return g(this, o) !== -1;
			};e.add = function () {
				var s = arguments,
				    r = 0,
				    p = s.length,
				    q,
				    o = false;do {
					q = s[r] + "";if (g(this, q) === -1) {
						this.push(q);o = true;
					}
				} while (++r < p);if (o) {
					this._updateClassName();
				}
			};e.remove = function () {
				var t = arguments,
				    s = 0,
				    p = t.length,
				    r,
				    o = false,
				    q;do {
					r = t[s] + "";q = g(this, r);while (q !== -1) {
						this.splice(q, 1);o = true;q = g(this, r);
					}
				} while (++s < p);if (o) {
					this._updateClassName();
				}
			};e.toggle = function (p, q) {
				p += "";var o = this.contains(p),
				    r = o ? q !== true && "remove" : q !== false && "add";if (r) {
					this[r](p);
				}if (q === true || q === false) {
					return q;
				} else {
					return !o;
				}
			};e.toString = function () {
				return this.join(" ");
			};if (b.defineProperty) {
				var l = { get: i, enumerable: true, configurable: true };try {
					b.defineProperty(m, a, l);
				} catch (h) {
					if (h.number === -2146823252) {
						l.enumerable = false;b.defineProperty(m, a, l);
					}
				}
			} else {
				if (b[f].__defineGetter__) {
					m.__defineGetter__(a, i);
				}
			}
		})(self);
	} else {
		(function () {
			var b = document.createElement("_");b.classList.add("c1", "c2");if (!b.classList.contains("c2")) {
				var c = function c(e) {
					var d = DOMTokenList.prototype[e];DOMTokenList.prototype[e] = function (h) {
						var g,
						    f = arguments.length;for (g = 0; g < f; g++) {
							h = arguments[g];d.call(this, h);
						}
					};
				};c("add");c("remove");
			}b.classList.toggle("c3", false);if (b.classList.contains("c3")) {
				var a = DOMTokenList.prototype.toggle;DOMTokenList.prototype.toggle = function (d, e) {
					if (1 in arguments && !this.contains(d) === !e) {
						return e;
					} else {
						return a.call(this, d);
					}
				};
			}b = null;
		})();
	}
};

/* requestAnimationFrame
----------------------------------------------------------------------*/
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

(function () {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame) window.requestAnimationFrame = function (callback, element) {
		var currTime = new Date().getTime();
		var timeToCall = Math.max(0, 16 - (currTime - lastTime));
		var id = window.setTimeout(function () {
			callback(currTime + timeToCall);
		}, timeToCall);
		lastTime = currTime + timeToCall;
		return id;
	};

	if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function (id) {
		clearTimeout(id);
	};
})();

/* Help function
----------------------------------------------------------------------*/
/**
 * check if has 3d animation
 * return true if has
 */
var check3d = function check3d() {

	"use strict";

	if (!window.getComputedStyle) {
		return false;
	}

	var el = document.createElement('p'),
	    has3d,
	    transforms = {
		'webkitTransform': '-webkit-transform',
		'OTransform': '-o-transform',
		'msTransform': '-ms-transform',
		'MozTransform': '-moz-transform',
		'transform': 'transform'
	},
	    objectFit = {
		'objectFit': 'object-fit'
	};

	// Add it to the body to get the computed style
	document.body.insertBefore(el, null);

	for (var t in transforms) {
		if (el.style[t] !== undefined) {
			el.style[t] = 'translate3d(1px,1px,1px)';
			has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
		}
	}

	for (var t in objectFit) {
		if (el.style[t] !== undefined) {
			el.style[t] = 'cover';
			hasObjectFit = window.getComputedStyle(el).getPropertyValue(objectFit[t]);
		}
	}

	document.body.removeChild(el);

	return {
		has3d: has3d !== undefined && has3d.length > 0 && has3d !== "none",
		hasObjectFit: hasObjectFit !== undefined && has3d.length > 0 && hasObjectFit !== "none"
	};
};

var has3d = check3d().has3d;
var hasObjectFit = check3d().hasObjectFit;
/* From Modernizr */
function whichTransitionEvent() {
	var t;
	var el = document.createElement('fakeelement');
	var transitions = {
		'transition': 'transitionend',
		'OTransition': 'oTransitionEnd',
		'MozTransition': 'transitionend',
		'WebkitTransition': 'webkitTransitionEnd'
	};

	for (t in transitions) {
		if (el.style[t] !== undefined) {
			return transitions[t];
		}
	}
}

/* Listen for a transition! */
var transitionEvent = whichTransitionEvent();
/**
 * Detecting CSS animation support
 * @type {Boolean}
 */
var animation = false,
    animationstring = 'animation',
    keyframeprefix = '',
    domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
    pfx = '',
    elm = document.createElement('div');

if (elm.style.animationName !== undefined) {
	animation = true;
}

if (animation === false) {
	for (var i = 0; i < domPrefixes.length; i++) {
		if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
			pfx = domPrefixes[i];
			animationstring = pfx + 'Animation';
			keyframeprefix = '-' + pfx.toLowerCase() + '-';
			animation = true;
			break;
		}
	}
}
/**
 * Set transform style
 */
var transform = function transform(el, value) {
	el.style.WebkitTransform = value;
	el.style.msTransform = value;
	el.style.transform = value;
};
/**
 * Set transition style
 */
var transition = function transition(el, value) {
	el.style.WebkitTransition = value;
	el.style.msTransition = value;
	el.style.transition = value;
};
/**
 * Load page
 * @param  {[string]} action [description]
 * @param  {[node]} block  [description]
 */
function ajaxPageLoader(action, block) {}
/**
 * Center image
 */

var centerImage = function centerImage(options) {

	"use strict";

	scroll.init();

	if (!options) {
		return false;
	}

	if (!options.block) {
		return false;
	}

	if (!options.nameClass) {
		options.nameClass = '.center-image';
	}

	var isBackground = !options.block.classList.contains('gallery');

	var imgs = options.block.querySelectorAll(options.nameClass);

	if (imgs.length <= 0) {
		return false;
	}

	var setSize = function setSize(img, width, height, parentWidth) {
		var proportion = width / height,
		    parentHeight;

		if (isBackground) {
			if (img.parentNode) {
				parentHeight = img.parentNode.clientHeight;
			}
		} else {
			parentHeight = parentWidth;
		}

		var imgWidth = parentHeight * proportion;
		var imgHeight = parentHeight;
		var top = 0;
		var left = 0;

		if (imgWidth < parentWidth) {
			imgWidth = parentWidth;
			imgHeight = imgWidth / proportion;
		}

		if (parentHeight < imgHeight) {
			top = -(imgHeight - parentHeight) / 2;
		}

		if (parentWidth < imgWidth) {
			left = -(imgWidth - parentWidth) / 2;
		}

		img.style.width = imgWidth + 'px';
		img.style.height = imgHeight + 'px';
		img.style.top = top + 'px';
		img.style.left = left + 'px';
		img.style.position = 'absolute';

		if (img.parentNode) {
			img.parentNode.classList.remove('loading');
		}
	};

	arrProto.forEach.call(imgs, function (img) {
		img.parentNode.style.height = '';

		img.parentNode.classList.add('loading');

		resetStyle(img);

		var parentWidth = img.parentNode.clientWidth;

		if (!isBackground) {
			img.parentNode.style.height = parentWidth + 'px';
		}

		var newImg = new Image();
		newImg.addEventListener('load', function (event) {
			img.setAttribute('src', event.currentTarget.getAttribute('src'));
			var height = newImg.naturalHeight;
			var width = newImg.naturalWidth;
			setSize(img, width, height, parentWidth);
		});
		newImg.src = img.src;

		function resetStyle(img) {
			img.style.width = '';
			img.style.height = '';
			img.style.top = '';
			img.style.left = '';
			img.style.position = '';
		}
	});
};

var GoogleMap = (function () {
	function GoogleMap(googleMap) {
		_classCallCheck(this, GoogleMap);

		if (!googleMap) {
			return false;
		}

		this.googleMap = googleMap;

		this.init();
		this.resize();
	}

	/* VIDEO */

	_createClass(GoogleMap, [{
		key: 'init',
		value: function init() {

			this.canvasMap = this.googleMap.querySelector('.map-canvas');
			if (!this.canvasMap) {
				return false;
			}

			this.parentCanvasMap = this.canvasMap.parentNode;
			this.parentMap = this.parentCanvasMap.parentNode;

			this.canvasMap.innerHTML = '';

			this.googleMap.style.top = '';
			this.googleMap.style.left = '';
			this.googleMap.style.width = '';
			this.googleMap.style.height = '';

			var pages = document.querySelector('.cospo-page');
			if (pages) {
				this.canvasMap.style.width = pages.clientWidth + 'px';
			}

			// customize google map api
			var mapOptions = {
				zoom: 16,
				center: new google.maps.LatLng(51.523751, -0.158435),
				// center: new google.maps.LatLng(0, 0),
				scrollwheel: false,
				panControl: false,
				zoomControl: false,
				scaleControl: false,
				navigationControl: false,
				draggable: false,
				disableDefaultUI: true,
				disableDoubleClickZoom: false,
				maxZoom: 16,
				minZoom: 16
			};

			var marker = this.marker = new google.maps.Marker({
				position: new google.maps.LatLng(51.523751, -0.158435),
				title: 'Property Location'
			});
			// icon: 'img/map-cursor.png'
			var map = this.map = new google.maps.Map(this.canvasMap, mapOptions);
			marker.setMap(map);

			// console.log(marker);

			map.addListener('zoom_changed', function () {
				return false;
			});
		}
	}, {
		key: 'showMap',
		value: function showMap(target) {
			var _this = this;

			if (!target) {
				return false;
			}

			var lat = target.getAttribute('data-lat');
			var lng = target.getAttribute('data-lng');

			if (lat && lng) {
				// this.map.setCenter(new google.maps.LatLng( lat, lng ) );
				this.map.setCenter(new google.maps.LatLng(lat, lng));
				this.marker.position = new google.maps.LatLng(lat, lng);
				this.marker.setMap(this.map);
			}

			var navBtn = document.querySelector('.navigation-btn');
			if (navBtn) {
				navBtn.classList.remove('hideMenu');
			}

			var nav = document.querySelector('.navigation');

			if (nav) {
				nav.classList.remove('enable-hover');
			}

			if (window.innerWidth < 992) {
				document.body.appendChild(this.parentCanvasMap);
			}

			var position = target.getBoundingClientRect();
			this.top = position.top;
			this.left = position.left;
			//
			// this.width = target.clientWidth;
			// this.height = target.clientHeight;
			//
			// this.googleMap.style.width = this.width + 'px';
			// this.googleMap.style.height = this.height + 'px';
			//
			// this.googleMap.style.top = this.top + 'px';
			// this.googleMap.style.left = this.left + 'px';

			this.googleMap.style.transformOrigin = this.left + 'px ' + this.top + 'px';
			this.googleMap.style.WebkitTransformOrigin = this.left + 'px ' + this.top + 'px';
			this.googleMap.style.MsTransformOrigin = this.left + 'px ' + this.top + 'px';

			//
			// this.canvasMap.style.top = -this.top + 'px';
			// this.canvasMap.style.left = -this.left + 'px';

			setTimeout(function () {
				_this.googleMap.classList.add('open');
				//
				// this.googleMap.style.width = '100%';
				// this.googleMap.style.height = '100%';
				// this.googleMap.style.height = '100vh';
				//
				// this.googleMap.style.top = '0';
				// this.googleMap.style.left = '0';
				//
				// this.canvasMap.style.top = '0';
				// this.canvasMap.style.left = '0';
			}, 100);

			this.setAction(target);
		}
	}, {
		key: 'hideMap',
		value: function hideMap() {
			var _this2 = this;

			if (!this.googleMap) {
				return false;
			}

			if (window.innerWidth < 992) {
				setTimeout(function () {
					_this2.parentMap.appendChild(_this2.parentCanvasMap);
				}, 200);
			}

			var navBtn = document.querySelector('.navigation-btn');
			if (navBtn) {

				var nav = document.querySelector('.navigation');

				if (nav) {
					if (!nav.classList.contains('open')) {
						if (window.innerWidth < 992) {
							navBtn.setAttribute('data-action', 'show-menu');
						} else {
							navBtn.setAttribute('data-action', 'go-next-page');
						}
					} else {
						if (window.innerWidth < 992) {
							navBtn.setAttribute('data-action', 'close-menu');
						} else {
							navBtn.setAttribute('data-action', 'go-next-page');
						}
					}

					nav.classList.add('enable-hover');
				}
			}

			// this.googleMap.style.width = this.width + 'px';
			// this.googleMap.style.height = this.height + 'px';
			//
			// this.googleMap.style.top = this.top + 'px';
			// this.googleMap.style.left = this.left + 'px';
			//
			// // this.googleMap.style.listStyle = "width:" + this.width + "px; height:"+ this.height + "px; top:" + this.top + "px; left:" + this.left + "px;";
			//
			// this.canvasMap.style.top = -this.top + 'px';
			// this.canvasMap.style.left = -this.left + 'px';

			// this.canvasMap.style.listStyle = "top:" + -this.top + "px; left:" +
			// -this.left + "px;";

			// this.googleMap.style.opacity = 0;
			this.googleMap.classList.remove('open');

			setTimeout(function () {

				_this2.googleMap.style.opacity = '';
			}, 300);
		}
	}, {
		key: 'setAction',
		value: function setAction() {
			var navBtn = document.querySelector('.navigation-btn');
			if (navBtn) {
				navBtn.setAttribute('data-action', 'hide-map');
			}
		}
	}, {
		key: 'resize',
		value: function resize() {
			var _this3 = this;

			var t = undefined;
			window.addEventListener('resize', function () {
				clearTimeout(t);
				t = setTimeout(function () {
					_this3.init();
				}, 200);
			});
		}
	}]);

	return GoogleMap;
})();

var Video = (function () {
	function Video() {
		_classCallCheck(this, Video);
	}

	_createClass(Video, [{
		key: 'showVideo',
		value: function showVideo(target) {
			this.cloneVideo(target);
		}
	}, {
		key: 'cloneVideo',
		value: function cloneVideo(target) {
			var _this4 = this;

			if (!target) {
				return false;
			}

			this.target = target;

			if (this.copyVideo) {
				return false;
			}

			// this.video = this.target.querySelector( 'video' );
			var video = this.video = this.target.querySelector('iframe');

			if (!video) {
				video = this.video = this.target.querySelector('video');

				if (!video) {
					this.video = document.createElement('iframe');

					var videoSrc = target.getAttribute('data-src');
					console.log(videoSrc);

					if (!videoSrc) {
						return false;
					}

					this.video.setAttribute('src', videoSrc);
				}
			}

			this.parentVideo = this.video.parentNode;

			this.wrapper = document.createElement('div');
			this.wrapperVideo = document.createElement('div');
			this.wrapperVideoContainer = document.createElement('div');

			this.wrapper.classList.add('cloned-video');

			this.wrapperVideo.classList.add('player-wrapper');

			this.wrapperVideoContainer.classList.add('player-wrapper-container');

			this.wrapperVideo.appendChild(this.wrapperVideoContainer);

			this.wrapper.appendChild(this.wrapperVideo);

			this.createCloseBtn();

			document.body.appendChild(this.wrapper);
			this.wrapperVideoContainer.appendChild(this.video);

			setTimeout(function () {
				_this4.video.controls = true;
				_this4.wrapper.classList.add('opened');

				// iframe width/height
				var width = video.getAttribute('width');
				var height = video.getAttribute('height');
				if (!width || !height) {
					return false;
				}
				var ratio = height / width;
				var frameWidth = window.innerWidth * 0.8 * ratio;
				video.width = window.innerWidth * 0.8;
				video.height = frameWidth;
			}, 0);
		}
	}, {
		key: 'createCloseBtn',
		value: function createCloseBtn() {
			var _this5 = this;

			var button = document.createElement('button');
			button.onclick = function () {
				_this5.closeVideo();
			};
			if (this.wrapperVideoContainer) {
				this.wrapperVideoContainer.appendChild(button);
			} else {
				this.wrapper.appendChild(button);
			}
		}
	}, {
		key: 'closeVideo',
		value: function closeVideo() {
			// this.copyVideo.classList.remove('opened');
			// if( this.target ) {
			//   this.target.classList.remove('loading');
			// }
			// setTimeout(()=>{

			this.wrapper.parentNode.removeChild(this.wrapper);
			this.video.controls = false;
			this.parentVideo.appendChild(this.video);
			iframeSize();

			// },300);
		}
	}]);

	return Video;
})();

var video = new Video();

/**
* Classes
*/
/* Page Translate
----------------------------------------------------------------------*/
/**
 * class PageTranslate
 * change pages on click
 * Author: Mestafor
 */

var PageTranslate = (function () {

	/**
  * Constructor
  * @param  {Object} options
  * @return {[boolean]}  if all success return true
  */

	function PageTranslate() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		_classCallCheck(this, PageTranslate);

		// class options
		this.positionPage = null; // pages X coordinate
		this.currentPage = 0; // current page
		this.lengthPage = 0; // count of pages

		this.idArray = [];

		this.options = options;

		this.timeFraction = options.timeFraction || 'cubic-bezier(.24,.27,.36,.97)';
		// this.timeFraction = options.timeFraction || 'ease';
		this.speed = options.speed || 600;

		// content
		this.contentPage = document.querySelectorAll('.cospo-page');

		if (this.contentPage.length <= 0) {
			return false;
		}

		this.contentPageLength = this.contentPage.length;

		this.init();

		// when resize update page position

		this.resize();

		return true;
	}

	/* Scroll
 ----------------------------------------------------------------------*/
	// import { throttle } from 'lodash';
	//
	// console.log(throttle);

	/**
  * Custom scroll
  * Author: Mestafor
  */

	_createClass(PageTranslate, [{
		key: 'init',
		value: function init() {

			if (!this.backgroundIsExist) {
				this.createBackgrounds();
			}

			var nav = document.querySelector('.navigation');
			if (nav) {
				nav.style.left = '';
			}

			this.setPosition();

			if (window.innerWidth < 768) {
				var overlay = document.querySelector('.main-overlay');
				if (overlay) {
					overlay.style.width = '';
				}
			}
		}

		/*
  	Create backgrounds after main with id all-pages ( dont ask about id name... )
  */
	}, {
		key: 'createBackgrounds',
		value: function createBackgrounds() {
			var _this6 = this;

			var mainDiv = document.createElement('div');
			var pages = 'all-pages';
			mainDiv.setAttribute('id', pages);

			// save all background
			this.backgrounds = [];

			// let firstBg = null;
			var firstBg = null,
			    secondBg = null,
			    lastBg = null;

			/****************** NEW ***********************/

			arrProto.forEach.call(this.contentPage, function (elem, index) {

				var background = elem.querySelector('.background'),
				    cloneBackground = background ? background.cloneNode(true) : false;

				if (!cloneBackground) {
					return false;
				}

				if (index === 0) {
					firstBg = _this6.firstBg = cloneBackground.cloneNode(true);
				}

				if (index === 1) {
					secondBg = _this6.secondBg = cloneBackground.cloneNode(true);
				}

				if (index === _this6.contentPageLength - 1) {
					lastBg = _this6.lastBg = cloneBackground.cloneNode(true);
				}

				_this6.backgrounds.push(cloneBackground);

				var sliders = mainDiv.querySelectorAll('.slider');
				if (sliders) {
					arrProto.forEach.call(sliders, function (slider) {
						if (slider.classList.contains('slider-inited')) {
							slider.classList.remove('slider-inited');
						}
					});
				}

				if (cloneBackground) {
					mainDiv.appendChild(cloneBackground);
				}
			});

			if (firstBg) {
				mainDiv.appendChild(firstBg);
				this.backgrounds.push(firstBg);
			}
			if (secondBg) {
				mainDiv.appendChild(secondBg);
				this.backgrounds.push(secondBg);
			}
			if (lastBg) {
				mainDiv.insertBefore(lastBg, this.backgrounds[0]);
				this.backgrounds.unshift(lastBg);
			}

			// NEW **********************
			if (!this.backgrounds.length) {
				return false;
			}
			//********************

			// this.backgrounds.push( firstBg );

			this.backgroundDiv = mainDiv;

			document.body.appendChild(mainDiv);

			this.pages = document.getElementById(pages);

			this.pages.addEventListener('scroll', function (event) {
				event.preventDefault();
			});

			this.backgroundIsExist = true;

			var bg = this.backgroundDiv.querySelectorAll('.background');
			// var bg = document.body.querySelectorAll( '.page' );

			this.sliders = [];

			arrProto.forEach.call(bg, function (item, index) {
				_this6.sliders[index] = [];
				var slide = item.querySelectorAll('.slider');
				if (!slide.length) {
					return false;
				}
				arrProto.forEach.call(slide, function (s, t) {
					// setTimeout( () =>
					// {
					_this6.sliders[index].push(new Slider({
						element: s,
						delay: 2400,
						speed: 1200
					}));
					// }, t * 800 );
				});

				// item.addEventListener( transitionEvent, () => {
				// 	this.onTransitionEnd();
				// } );
			});

			this.pages.addEventListener(transitionEvent, function () {
				_this6.onTransitionEnd();
			});
		}

		/**
   * set elements positionPage
   * @return {} [description]
   */
	}, {
		key: 'setPosition',
		value: function setPosition() {
			var _this7 = this;

			// координати сторінок по Х
			var positionPage = this.positionPage = [],
			   
			// вибирає усі сторінки у блоці
			pages;

			this.contentPage = pages = document.querySelectorAll('.cospo-page');

			var dynamicPage = null;

			this.contentPage = pages = arrProto.filter.call(this.contentPage, function (p) {
				var id = p.getAttribute('id');
				if (!id) {
					return false;
				}
				var ajaxPage = id.match(/ajax-page/gi);
				if (!ajaxPage) {
					return p;
				} else {
					dynamicPage = p;
				}
			});

			if (!pages) {
				console.warning('Warning: there are no elements with class "copso-page"');
				return false;
			}

			if (!this.contentPageLength) {
				this.contentPageLength = pages.length;
			}

			this.hasCurrent = false;
			pages[0].style.width = '';
			var pageWidth = parseInt(pages[0].offsetWidth, 10) + 1;

			if (dynamicPage) {
				dynamicPage.style.width = pageWidth + 'px';
			}

			// set overlay width
			var overlay = document.querySelector('.main-overlay');
			if (overlay) {
				var oW = pageWidth;
				if (window.innerWidth < 992) {
					oW = oW - 1;
				}
				overlay.style.width = oW + 'px';
			}

			var wW = window.innerWidth;

			// set navigation width
			var nav = document.querySelector('.navigation');
			if (nav) {
				if (wW >= 992) {
					nav.style.left = pageWidth + 'px';
				}
			}

			var fullBgWidth = 0;

			this.idArray = [];

			// this.bgPositions = [];

			// записує координати по Х
			// add background's coordinate to array
			arrProto.forEach.call(pages, function (page, index) {
				var id = page.getAttribute('id');

				var ajax = id.match(/^ajax-page/gi);

				if (ajax) {
					return;
				}

				_this7.idArray.push(id);

				if (wW >= 768) {

					page.style.width = pageWidth + 'px';
					// if ( wW >= 992 && this.backgrounds[ index ] ) {
					// 	this.backgrounds[ index ].style.width = pageWidth + 'px';
					// 	this.backgrounds[ index ].style.left = pageWidth * index + 'px';
					// 	fullBgWidth = fullBgWidth + pageWidth;
					// }
				}

				// if ( page.classList.contains( 'current-page' ) )
				// {
				// 	this.hasCurrent = true;
				// 	// this.goTo( index, 0 );
				// 	this.currentPage = index;
				// }
			});

			arrProto.forEach.call(this.backgrounds, function (background, index) {
				if (wW >= 992 && _this7.backgrounds[index]) {
					positionPage.push(pageWidth * index);
					_this7.backgrounds[index].style.width = pageWidth + 'px';
					// if( index === 0 ) {
					// this.backgrounds[ index ].style.left = 0;
					// } else {
					_this7.backgrounds[index].style.left = pageWidth * index + 'px';
					// }
					fullBgWidth = fullBgWidth + pageWidth;
				}
			});

			var parentBg = document.getElementById('all-pages');
			if (parentBg && wW >= 992) {
				parentBg.style.width = fullBgWidth + 'px';
			} else {
				parentBg.style.width = '';
			}

			// if ( this.currentPage )
			// {
			// 	this.goTo( this.currentPage, 0 );
			// }
			//
			// if ( !this.hasCurrent )
			// {
			this.goToHash();
			// }

			this.hasCurrent = false;

			galleryImg(this.backgroundDiv);
		}

		/**
   * Go to hash
   * @return {[type]} [description]
   */
	}, {
		key: 'goToHash',
		value: function goToHash() {

			var hash = location.hash.replace('#', '');

			this.hashAction = hash.match(/\/\S+/ig);

			if (this.hashAction) {
				hash = hash.replace(/\/\S+/ig, '');
			} else {
				this.hashAction = '';
			}

			if (hash) {
				this.currentPage = this.idArray.indexOf(hash);
				if (this.currentPage === -1) {
					this.currentPage = 0;
				}
			} else {
				this.currentPage = 0;
			}

			this.goTo(this.currentPage, 0);

			this.contentPage[this.currentPage].classList.add('current-page');
		}

		/**
   * Go to next page
   * @return {boolean} true if success
   */
	}, {
		key: 'nextPage',
		value: function nextPage() {
			// якщо сторінок 1 або менше ( менше не може бути )
			if (this.contentPage <= 1) {
				return true;
			}

			// початкова позиція
			var current = this.currentPage;
			// збільшується на 1
			current++;
			// якщо більша за кількість елементів прирівнюється до 0
			if (current >= this.contentPageLength) {
				current = 0;
			}

			this.closeAjaxPage();
			// пререходить на задану позицію
			this.goTo(current);

			return true;
		}

		/**
   * Go to previous page
   * @return {boolean} true if success
   */
	}, {
		key: 'prevPage',
		value: function prevPage() {

			// якщо сторінок 1 або менше ( менше не може бути )
			if (this.contentPage <= 1) {
				return true;
			}

			// початкова позиція
			var current = this.currentPage;
			// збільшується на 1
			current--;
			// якщо більша за кількість елементів прирівнюється до 0
			if (current < 0) {
				current = this.contentPageLength - 1;
			}

			this.closeAjaxPage();
			// пререходить на задану позицію
			this.goTo(current);

			return true;
		}

		/**
   * Close Ajax Page
   * @return {[type]} [description]
   */
	}, {
		key: 'closeAjaxPage',
		value: function closeAjaxPage() {

			var ajaxPage = null;
			if (window.gallery) {
				if (gallery.mainBlock) {
					ajaxPage = gallery.mainBlock;
				}
				if (ajaxPage) {
					ajaxPage.classList.remove('current-page');

					scroll.init(this.contentPage[this.currentPage]);

					this.hashAction = '';
					setTimeout(function () {
						if (ajaxPage.parentNode) {
							ajaxPage.parentNode.removeChild(ajaxPage);
						}
					}, 400);
				}
			}

			var nav = document.querySelector('.navigation');
			if (nav) {
				nav.classList.add('enable-hover');
			}
			document.querySelector('main').classList.remove('ajax-page-dymamic--opened');
		}

		/**
   * Go to еру specified page
   * @param  {[int]} page index
   * @param  {[int]} animation speed ms
   * @param  {[string]} animation time function
   * @return {boolean} true if success
   */
	}, {
		key: 'goTo',
		value: function goTo(page) {
			var _this8 = this;

			var speed = arguments.length <= 1 || arguments[1] === undefined ? this.speed : arguments[1];
			var timeFraction = arguments.length <= 2 || arguments[2] === undefined ? this.timeFraction : arguments[2];

			if (speed) {
				if (window.innerWidth >= 992) {
					if (this.isAnimate) {
						return;
					}
					this.isAnimate = true;
				} else {
					this.isAnimate = false;
				}
			}

			// stop slider
			if (this.sliders.length) {
				var slider = this.sliders[this.currentPage + 1];
				var slider2 = this.currentPage === 0 || this.currentPage === 1 ? this.sliders[this.currentPage + this.contentPageLength + 1] : this.sliders[this.currentPage + 1];
				slider2 = this.currentPage === this.contentPageLength - 1 ? this.sliders[0] : slider2;

				if (slider) {
					var _i = slider.length;
					if (_i) {
						for (; _i--;) {
							slider[_i].stopSlide();
						}
					}
				}
				if (slider2) {
					var _i2 = slider2.length;
					if (_i2) {
						for (; _i2--;) {
							slider2[_i2].stopSlide();
						}
					}
				}
			}

			//start slider if exist after end of animation
			setTimeout(function () {
				//start slider
				if (_this8.sliders) {
					var slider = _this8.sliders[page + 1];
					var slider2 = page === 0 || page === 1 ? _this8.sliders[page + _this8.contentPageLength + 1] : _this8.sliders[page + 1];
					slider2 = page === _this8.contentPageLength - 1 ? _this8.sliders[0] : slider2;

					if (slider) {
						var _i3 = slider.length;
						if (_i3) {
							slider.forEach(function (item, t) {
								if (item.isAnimate) {
									return false;
								}

								setTimeout(function () {
									item.startSlide();
								}, t * 600);
							});
						}
					}
					if (slider2) {
						var _i4 = slider2.length;
						if (_i4) {
							slider2.forEach(function (item, t) {
								if (item.isAnimate) {
									return false;
								}

								setTimeout(function () {
									item.startSlide();
								}, t * 600);
							});
						}
					}
				}
			}, speed + 100);

			// previous page
			this.previousPage = this.currentPage;
			// next page after current page
			// this.followPage = page + 1;
			// check for length of pages
			if (this.followPage >= this.contentPageLength) {
				this.followPage = 0;
			}

			// css
			if (window.innerWidth >= 992) {
				page = page >= this.contentPageLength ? page - 1 : page;
				this.changePageCss(page, speed);
				// this.changePageParalax( page, speed );
			}

			if (window.innerWidth < 992) {
				this.animateScrollTop(page, speed);
			}

			if (this.hasCurrent) {
				return false;
			}

			// css
			if (!this.currentPage || this.currentPage < 0) {
				this.currentPage = 0;
			}

			if (this.currentPage >= this.contentPageLength) {
				this.currentPage = this.contentPageLength - 1;
			}

			this.contentPage[this.currentPage].classList.remove('current-page');

			this.currentPage = page;

			// css
			if (this.currentPage < 0) {
				this.currentPage = 0;
			}
			if (this.currentPage >= this.contentPageLength) {
				this.currentPage = this.contentPageLength - 1;
			}

			this.contentPage[this.currentPage].classList.add('current-page');

			scroll.init(this.contentPage[this.currentPage]);

			if (window.history) {
				if (history.pushState) {
					history.pushState(null, '' + this.contentPage[page].id + this.hashAction, '#' + this.contentPage[page].id + this.hashAction);
				}
			} else {
				location.hash = this.contentPage[page].id + this.hashAction;
			}

			this.hashAction = '';

			if (window.gallery) {
				gallery.onFirstLoad();
			}

			if (window.googleMap) {
				googleMap.hideMap();
			}

			var menu = document.querySelector('.navigation-menu');
			if (menu) {
				var li = menu.querySelector('a[href="#' + this.contentPage[page].id + '"]'),
				    preLi = menu.querySelector('a[href="#' + this.contentPage[this.previousPage].id + '"]');
				if (li) {
					preLi.parentNode.classList.remove('active');
					li.parentNode.classList.add('active');
				}
			}

			var overlay = document.querySelector('.main-overlay');
			if (overlay) {
				if (window.innerWidth >= 992) {
					if (this.contentPage[this.currentPage].classList.contains('no-bg')) {
						overlay.classList.add('hide-bg');
					} else {
						overlay.classList.remove('hide-bg');
					}
				} else {
					overlay.classList.remove('hide-bg');
				}
			}

			if (window.closeSignIn) {
				closeSignIn();
			}

			return true;
		}

		/*
   * animate all-page with javascript requestAnimationFrame
   */
	}, {
		key: 'changePage',
		value: function changePage(currentPosition, endPosition) {
			var speed = arguments.length <= 2 || arguments[2] === undefined ? this.speed : arguments[2];

			var startX = this.lastPosition || this.positionPage[currentPosition],
			    progressX = startX,
			    endX = this.positionPage[endPosition],
			    path = Math.abs(startX - endX),
			    self = this;

			var goLeft = startX < endX;

			var contPage = this.contentPage[this.currentPage].classList;

			contPage.remove('current-page');

			if (!goLeft) {
				contPage.add('right');
				setTimeout(function () {
					contPage.remove('right');
				}, speed);
			}

			this.animate({
				duration: speed,
				timing: function timing(timeFraction) {
					return timeFraction < 0.5 ? 4 * timeFraction * timeFraction * timeFraction : (timeFraction - 1) * (2 * timeFraction - 2) * (2 * timeFraction - 2) + 1;
				},
				draw: function draw(progress) {

					progressX = goLeft ? startX + path * progress : startX - path * progress;

					transform(self.pages, has3d ? 'translate3d(' + -progressX + 'px, 0, 0)' : 'translateX(' + -progressX + 'px)');

					self.lastPosition = progressX;

					if (progress >= 0.7) {
						self.contentPage[self.currentPage].classList.add('current-page');
					}

					if (progress >= 1) {
						self.isAnimate = false;
					}
				}
			});
		}

		/*
   * animate all-page with css animation
   */
	}, {
		key: 'changePageCss',
		value: function changePageCss(endPosition) {
			var speed = arguments.length <= 1 || arguments[1] === undefined ? this.speed : arguments[1];
			var timeFraction = arguments.length <= 2 || arguments[2] === undefined ? this.timeFraction : arguments[2];

			if (endPosition === 0 && this.currentPage === this.contentPageLength - 1) {
				endPosition = this.contentPageLength + 1;
				this.changeToFirstBg = true;
			} else if (endPosition === this.contentPageLength - 1 && this.currentPage === 0) {
				endPosition = 0;
				this.changeToLastBg = true;
			} else {
				endPosition = endPosition + 1;
			}

			if (!this.pages) {
				this.onTransitionEnd();
				return false;
			}

			// change speed
			this.pages.style.WebkitTransition = '-webkit-transform ' + speed + 'ms ' + timeFraction;
			transition(this.pages, 'transform ' + speed + 'ms ' + timeFraction);

			// change translateX
			transform(this.pages, has3d ? 'translate3d(' + -this.positionPage[endPosition] + 'px, 0, 0)' : 'translateX(' + -this.positionPage[endPosition] + 'px)');

			if (this.previousPage + 1 < endPosition) {
				this.backgrounds[this.previousPage + 1].classList.add('previous-page-left');
			} else if (this.previousPage > endPosition) {
				this.backgrounds[endPosition].classList.add('previous-page-right');
			}

			if (!animation) {
				this.onTransitionEnd();
			}
		}

		/*
   * Animate backgrounds
   * need effect of paralax
   * delete if not use !!!!! ( it's for me )
   */
	}, {
		key: 'changePageParalax',
		value: function changePageParalax(endPosition) {
			var speed = arguments.length <= 1 || arguments[1] === undefined ? this.speed : arguments[1];
			var timeFraction = arguments.length <= 2 || arguments[2] === undefined ? this.timeFraction : arguments[2];

			this.onTransitionEnd();
		}

		/*
   *	for mobile and tablet animate scroll
   */
	}, {
		key: 'animateScrollTop',
		value: function animateScrollTop() {
			var _this9 = this;

			var endPosition = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
			var speed = arguments.length <= 1 || arguments[1] === undefined ? this.speed : arguments[1];

			if (!location.hash) {
				return false;
			}

			this.onLinkScroll = true;

			var elem = null;

			if (endPosition === undefined || endPosition === -1) {
				var id = location.hash.replace('#', '');
				id = id.replace(/\/\S+/, '');
				elem = document.getElementById(id);
			} else {
				elem = this.contentPage[endPosition];
			}

			var main = document.querySelector('main'),
			    startX = main.scrollTop,
			    progressX = startX,
			    endX = undefined,
			    path = undefined,
			    self = this;

			if (main) {
				main.classList.add('animateScrollTop');
			}

			if (elem) {
				endX = elem.offsetTop;
			} else {
				return false;
			}

			path = Math.abs(startX - endX);

			var goLeft = startX < endX;

			setTimeout(function () {
				_this9.animate({
					duration: speed,
					timing: function timing(timeFraction) {
						return timeFraction < 0.5 ? 4 * timeFraction * timeFraction * timeFraction : (timeFraction - 1) * (2 * timeFraction - 2) * (2 * timeFraction - 2) + 1;
					},
					draw: function draw(progress) {

						progressX = goLeft ? startX + path * progress : startX - path * progress;

						main.scrollTop = progressX;

						self.lastPosition = progressX;

						if (progress >= 1) {
							self.isAnimate = false;
							_this9.backgrounds[_this9.previousPage].classList.remove('active');
							if (progressX === 0) {
								_this9.backgrounds[1].classList.add('active');
							} else {
								_this9.backgrounds[_this9.currentPage].classList.add('active');
							}

							// var menu = document.querySelector( '.navigation-menu' );
							// if ( menu ) {
							// 	let li = menu.querySelector('a[href="#'+this.contentPage[ this.currentPage ].id+'"]'),
							// 			preLi = menu.querySelector('a[href="#'+this.contentPage[ this.previousPage ].id+'"]');
							// 	if(li) {
							// 		preLi.parentNode.classList.remove( 'active' );
							// 		li.parentNode.classList.add( 'active' );
							// 	}
							// }

							setTimeout(function () {
								_this9.onLinkScroll = false;
								if (main) {
									main.classList.remove('animateScrollTop');
								}
							}, 100);
						}
					}
				});
			}, 0);
		}

		/**
   * RequestAnimationFrame
   * @param  {[object]} setting
   * @return {}
   */
	}, {
		key: 'animate',
		value: function animate(setting) {

			var start = new Date().getTime();

			this.draw = window.requestAnimationFrame(animate);

			function animate() {

				// timeFraction от 0 до 1
				var now = new Date().getTime();

				var timeFraction = (now - start) / setting.duration;

				if (timeFraction > 1) {
					timeFraction = 1;
				}
				// текущее состояние анимации
				var progress = setting.timing(timeFraction);
				setting.draw(progress);

				if (timeFraction < 1) {
					window.requestAnimationFrame(animate);
				}
			}
		}

		/**
   * When translate was end
   * @param  {[type]} func [description]
   * @return {[type]}      [description]
   */
	}, {
		key: 'onTransitionEnd',
		value: function onTransitionEnd(func) {
			if (typeof func === 'function') {
				func();
			}

			this.backgrounds[this.previousPage + 1].classList.remove('previous-page-left');
			// this.backgrounds[ this.previousPage ].classList.remove( 'previous-page-right' );

			if (this.changeToFirstBg) {

				this.pages.style.WebkitTransition = '-webkit-transform ' + 0 + 'ms ';
				transition(this.pages, 'transform ' + 0 + 'ms ');

				// change translateX
				transform(this.pages, has3d ? 'translate3d(' + -this.positionPage[1] + 'px, 0, 0)' : 'translateX(' + -this.positionPage[1] + 'px)');

				this.changeToFirstBg = false;
			}

			if (this.changeToLastBg) {

				this.pages.style.WebkitTransition = '-webkit-transform ' + 0 + 'ms ';
				transition(this.pages, 'transform ' + 0 + 'ms ');

				// change translateX
				transform(this.pages, has3d ? 'translate3d(' + -this.positionPage[this.contentPageLength] + 'px, 0, 0)' : 'translateX(' + -this.positionPage[this.contentPageLength] + 'px)');

				this.changeToLastBg = false;
			}

			this.isAnimate = false;

			// scroll.init( this.contentPage[ this.currentPage ] );
		}

		/**
   * Tablet Background
   * @return {[type]} [description]
   */
	}, {
		key: 'tabletBackground',
		value: function tabletBackground(scrollTop) {
			var _this10 = this;

			var scrollHeight = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
			var height = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

			var changeBg = function changeBg() {
				var w = window.innerWidth;
				if (w >= 992) {
					return false;
				}

				var pages = _this10.contentPage,
				    length = _this10.contentPageLength;

				var active = null;

				if (scrollTop === 0) {
					active = 0;
				} else {
					for (var i = 0; i < length; i++) {

						var index = i + 1;
						if (index >= length) {
							index = 0;
						}

						if (scrollTop + height / 2 <= pages[1].offsetTop) {

							// this.backgrounds[1].style.opacity = 1;
							active = 0;
						} else if (scrollTop + height / 2 >= pages[length - 1].offsetTop) {
							// this.backgrounds[0].style.opacity = 1;
							active = length - 1;
						} else if (scrollTop + height / 2 >= pages[i].offsetTop && scrollTop + height / 2 < pages[index].offsetTop) {
							active = i;
						}
					}
				}

				if (active !== null) {

					if (_this10.backgrounds[active + 1].classList.contains('active')) {
						if (location.hash !== '#' + _this10.contentPage[active].getAttribute('id')) {
							if (window.history) {
								if (history.pushState) {
									history.pushState(null, null, '#' + _this10.contentPage[active].getAttribute('id'));
								}
							} else {
								location.hash = _this10.contentPage[active].getAttribute('id');
							}
						}
						return;
					}

					for (var j = 0; j < _this10.backgrounds.length; j++) {
						_this10.backgrounds[j].classList.remove('active');
					}

					var menu = document.querySelector('.navigation-menu');
					// if ( menu ) {
					// 	let li = menu.querySelector('a[href="#'+this.contentPage[ active ].id+'"]'),
					// 			preLi = menu.querySelector('a[href="#'+this.contentPage[ this.previousPage ].id+'"]');
					// 	if(li) {
					// 		preLi.parentNode.classList.remove( 'active' );
					// 		li.parentNode.classList.add( 'active' );
					// 	}
					// }

					// for ( i = 0; i < length; i++ ) {
					// 	if ( !this.backgrounds[ i ] ) {
					// 		continue;
					// 	}
					// this.backgrounds[ i ].classList.remove( 'active' );

					// let li = menu.querySelector('a[href="#'+this.contentPage[ i ].id+'"]');
					// li.parentNode.classList.remove( 'active' );
					// }

					// let preLi = menu.querySelector('a[href="#'+this.contentPage[ this.previousPage ].id+'"]');
					// preLi.parentNode.classList.remove( 'active' );

					_this10.backgrounds[active + 1].classList.add('active');
					// let li = menu.querySelector('a[href="#'+this.contentPage[ active ].id+'"]');
					// li.parentNode.classList.add( 'active' );
					//
					_this10.currentPage = active;

					if (window.history) {
						if (history.pushState) {
							history.pushState(null, null, '#' + _this10.contentPage[active].getAttribute('id'));
						}
					} else {
						location.hash = _this10.contentPage[active].getAttribute('id');
					}

					// gallery.onFirstLoad();
				}
			};

			changeBg();
		}

		/**
   * Resize devise
   * @return {[type]} [description]
   */
	}, {
		key: 'resize',
		value: function resize() {
			var _this11 = this;

			window.addEventListener('resize', function () {

				var pages = _this11.contentPage,
				    i = _this11.contentPageLength;

				for (; i--;) {
					pages[i].classList.remove('current-page');
					pages[i].style.width = '';
				}

				if (_this11.backgrounds) {
					var bg = _this11.backgrounds,
					    gbLength = bg.length;
					for (; gbLength--;) {
						if (!bg[gbLength]) {
							continue;
						}
						bg[gbLength].style.width = '';
						bg[gbLength].style.left = '';
					}
				}

				// gallery.deletePage();

				_this11.init();

				if (!_this11.contentPage[_this11.currentPage].classList.contains('.ajax-page')) {
					return;
				}

				var titleAjax = _this11.contentPage[_this11.currentPage].querySelectorAll('.ajax-gallery-title');

				if (titleAjax.length > 1) {
					titleAjax[0].parentNode.removeChild(titleAjax[0]);
				}
			});
		}
	}]);

	return PageTranslate;
})();

var Scroll = (function () {
	function Scroll() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		_classCallCheck(this, Scroll);

		this.options = options;

		this.scrollClass = this.options.scroll || '.scroll';

		this.resize();
	}

	/* Gallery
 ----------------------------------------------------------------------*/
	/**
  * Cospo Gallery
  * Author: Mestafor
  */

	/**
  * init scroll
  * @return {[type]} [description]
  */

	_createClass(Scroll, [{
		key: 'init',
		value: function init() {
			var block = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

			this.border = window.getComputedStyle(document.body, null).getPropertyValue('border-top-width');
			this.border = this.border.replace('px', '');

			this.setElemWidth(block);

			if (window.innerWidth >= 992) {
				this.reset = true;
			}
		}

		/**
   * Set element width
   * Create scroll
   * Add scroll event
   */
	}, {
		key: 'setElemWidth',
		value: function setElemWidth(block) {
			var _this12 = this;

			var pages = this.pages = null;

			if (block) {
				pages = this.pages = block.querySelectorAll(this.scrollClass);
			} else {
				pages = this.pages = document.querySelectorAll(this.scrollClass);
			}

			arrProto.forEach.call(pages, function (elem) {

				var parent = elem.parentNode;

				var divScroll = parent.querySelector('.element-scroll');
				if (divScroll) {
					if (divScroll.parentNode) divScroll.parentNode.removeChild(divScroll);
				}

				elem.parentNode.style.width = '';

				if (window.innerWidth < 992) {
					return;
				}

				parent.classList.add('overflow-height');
				parent.parentNode.classList.add('overflow-height');

				var offsetWidth = elem.offsetWidth,
				    clientWidth = elem.clientWidth,
				    clientHeight = elem.clientHeight,
				    scrollHeight = elem.scrollHeight,
				    width = offsetWidth - clientWidth;

				var style = getComputedStyle(parent),
				    paddingRight = style.paddingRight;

				paddingRight = paddingRight.replace('px', '');

				elem.style.width = parent.clientWidth + width + 'px';

				var divWidth = elem.parentNode.clientWidth - paddingRight * 2;

				if (scrollHeight > clientHeight) {

					var div = elem.parentNode;

					var precent = clientHeight / scrollHeight,
					    scrollWidth = Math.floor(clientWidth * precent),
					    scrollTop = elem.scrollTop;

					_this12.createScroll(elem, divWidth, scrollWidth, scrollTop, scrollHeight, clientHeight, paddingRight);
				}
			});
		}

		/**
   * Create scroll
   * @param  {[node]} elem    [description]
   * @param  {[float]} divWidth    [description]
   * @param  {[float]} scrollWidth [description]
   * @param  {[float]} scrollTop   [description]
   */
	}, {
		key: 'createScroll',
		value: function createScroll(elem, divWidth, scrollWidth, scrollTop, scrollHeight, clientHeight, paddingRight) {
			var doc = document,
			    divScroll = doc.createElement('div'),
			    scroll = doc.createElement('span');

			divScroll.classList.add('element-scroll');

			var left = 0;
			var top = 0;
			var margin = paddingRight;

			if (elem.parentNode.classList.contains('fixed-scroll')) {
				// detect IE9-11
				if (/MSIE 9/i.test(navigator.userAgent) || /MSIE 10/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent)) {
					left = this.border;
					top = this.border;
				}
				divWidth = Math.ceil((window.innerWidth - this.border * 2) * .69375) + 1;
			}

			divScroll.style.cssText = 'width: ' + divWidth + 'px; left: ' + left + 'px; top: ' + top + 'px; margin-left: ' + margin + 'px';

			scroll.classList.add('line-scroll');

			var left = scrollTop / (scrollHeight - clientHeight),
			    width = divWidth - scrollWidth,
			    scrollStyleWidth = scroll.style;

			scrollStyleWidth.width = scrollWidth + width * left + 'px';

			divScroll.appendChild(scroll);

			elem.parentNode.appendChild(divScroll);

			setTimeout(function () {
				divScroll.classList.add('show');
			}, 200);

			/* optimization scroll */
			/* https://developer.mozilla.org/en-US/docs/Web/Events/scroll */
			var last_known_scroll_position = 0;
			var ticking = false;

			var doSomething = function doSomething(scroll_pos) {
				var top = elem.scrollTop;
				left = top / (elem.scrollHeight - elem.clientHeight);
				scrollStyleWidth.width = scrollWidth + width * left + 'px';
			};

			elem.onscroll = function (event) {
				last_known_scroll_position = window.scrollY;
				if (!ticking) {
					window.requestAnimationFrame(function () {
						doSomething(last_known_scroll_position);
						ticking = false;
					});
				}
				ticking = true;
			};
		}
	}, {
		key: 'resetStyle',
		value: function resetStyle() {
			var scrolls = document.querySelectorAll('.scroll');
			if (scrolls.length > 0) {
				// arrProto.forEach.call( this.pages, elem =>
				arrProto.forEach.call(scrolls, function (elem) {
					elem.style.width = '';
					elem.style.top = '';
					elem.style.left = '';
					elem.style.paddingRight = '';
				});
			}
		}

		/**
   * When window resize
   */
	}, {
		key: 'resize',
		value: function resize() {
			var _this13 = this;

			// let t;
			window.addEventListener('resize', function () {
				// t = setTimeout(()=>{

				// },0);
				//when resize

				// throttle(()=>{
				if (window.innerWidth >= 992) {
					_this13.setElemWidth();
					_this13.reset = true;
					return true;
				}

				if (_this13.reset) {
					_this13.resetStyle();
					_this13.reset = false;
				}
				// }, 200);
			});
		}
	}]);

	return Scroll;
})();

var LeftMenu = (function () {
	function LeftMenu() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		_classCallCheck(this, LeftMenu);

		this.gallery = options.gallery || document.querySelector('.ajax-menu');
		this.galleryMenu = this.gallery.querySelector('ul');
		this.allElements = this.galleryMenu.querySelectorAll('li');
		this.allElementsLength = this.allElements.length;

		this.margin = options.margin || 0;

		this.currentPosition = options.currentPosition || 0;
		this.elementsPosition = [];

		this.init();

		this.resize();
	}

	/**
  * Ajax page
  * Author: Mestafor
  */

	_createClass(LeftMenu, [{
		key: 'init',
		value: function init() {

			if (window.innerWidth < 992) {
				this.setElements();
			} else {
				this.unSetElements();
			}

			this.mouseEvent();
		}
	}, {
		key: 'setElements',
		value: function setElements() {
			var _this14 = this;

			if (window.innerWidth < 992) {
				this.items = 5;
			}
			if (window.innerWidth < 768) {
				this.items = 3;
			}

			if (this.allElementsLength < this.items) {
				this.items = this.allElementsLength;
			}

			this.gallery.className = 'col-md-1 ajax-menu cospo-gallery';

			var galleryWidth = this.gallery.offsetWidth;
			this.elementsPosition = [];
			var elementWidth = (galleryWidth - this.margin * (this.items - 1)) / this.items;
			this.elemWidth = elementWidth;

			var fullWidth = 0;

			arrProto.forEach.call(this.allElements, function (element, index) {

				var active = element.querySelector('.active');
				if (active) {
					_this14.currentPosition = index;
				}

				var margin = _this14.margin;

				if (index + 1 >= _this14.allElementsLength) {
					margin = 0;
				}

				element.style.cssText = 'width: ' + elementWidth + 'px; margin-right: ' + margin + 'px';
				fullWidth += elementWidth + margin;
				_this14.elementsPosition.push((elementWidth + margin) * index);
			});

			this.elementsPosition.length = this.allElementsLength - this.items + 1;
			this.elementsPositionLength = this.elementsPosition.length;

			this.galleryMenu.style.width = fullWidth + 17 + 'px';

			if (this.currentPosition >= this.allElements - this.items) {
				this.currentPosition = this.allElements - this.items;
			}

			if (this.currentPosition) {
				this.goTo(this.currentPosition, 0);
			}

			if (!this.hasTransitionEvent) {
				this.galleryMenu.addEventListener(transitionEvent, function () {
					_this14.onTransitionEnd();
				});
				this.hasTransitionEvent = true;
			}
		}
	}, {
		key: 'unSetElements',
		value: function unSetElements() {

			this.gallery.classList.remove('cospo-gallery');

			arrProto.forEach.call(this.allElements, function (element, index) {
				element.style.cssText = 'margin-right: ' + 0 + 'px';
				element.style.width = '';
			});

			this.galleryMenu.style.width = '';
			this.galleryMenu.style.transform = '';
			this.galleryMenu.style.WebkitTransform = '';
		}
	}, {
		key: 'nextImage',
		value: function nextImage() {

			var current = this.currentPosition;
			current++;
			// якщо більша за кількість елементів прирівнюється до 0
			if (current >= this.elementsPositionLength) {
				current = 0;
			}

			// пререходить на задану позицію
			this.goTo(current);
		}
	}, {
		key: 'prevImage',
		value: function prevImage() {

			var current = this.currentPosition;
			current--;
			// якщо більша за кількість елементів прирівнюється до 0
			if (current < 0) {
				current = this.elementsPositionLength - 1;
			}

			// пререходить на задану позицію
			this.goTo(current);
		}
	}, {
		key: 'goTo',
		value: function goTo() {
			var index = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
			var speed = arguments.length <= 1 || arguments[1] === undefined ? 300 : arguments[1];
			var timeFraction = arguments.length <= 2 || arguments[2] === undefined ? 'ease' : arguments[2];

			if (index >= this.elementsPositionLength) {
				index = this.elementsPositionLength - 1;
			}

			if (index < 0) {
				index = 0;
			}

			this.currentPosition = index;

			var positionX = this.elementsPosition[index];

			this.galleryMenu.style.WebkitTransition = '-webkit-transform ' + speed + 'ms ' + timeFraction;
			transition(this.galleryMenu, 'transform ' + speed + 'ms ' + timeFraction);

			transform(this.galleryMenu, has3d ? 'translate3d(' + -positionX + 'px, 0, 0)' : 'translateX(' + -positionX + 'px)');

			if (!animation) {
				this.onTransitionEnd();
			}

			return true;
		}
	}, {
		key: 'mouseEvent',
		value: function mouseEvent() {
			var _this15 = this;

			if (this.isMouseEvent) {
				return;
			}

			this.isMouseEvent = true;

			var startX,
			    endX,
			    difference,
			    startTranslateX,
			    translateX,
			    doc = document;

			/**
    * Delete mouse and touch events from document
    */
			var removeEvent = function removeEvent() {

				_this15.galleryMenu.removeEventListener('mousemove', onMouseMove);
				_this15.galleryMenu.removeEventListener('touchmove', onMouseMove);
				_this15.galleryMenu.removeEventListener('mouseup', onMouseUp);
				_this15.galleryMenu.removeEventListener('touchend', onMouseUp);

				translateX = null;
			};

			/**
    * On mouse up
    * @param event
    */
			var onMouseUp = function onMouseUp(event) {

				if (window.innerWidth >= 992) {
					return false;
				}

				if (event.type === 'mouseup') {
					translateX = event.clientX;
				}

				if (translateX) {
					if (translateX - startTranslateX > 50) {
						_this15.currentPosition = _this15.currentPosition - _this15.items;
						_this15.goTo(_this15.currentPosition);
						removeEvent();
						return false;
					}

					if (translateX - startTranslateX < -50) {
						_this15.currentPosition = _this15.currentPosition + _this15.items;
						_this15.goTo(_this15.currentPosition);
						removeEvent();
						return false;
					}
				}

				_this15.goTo(_this15.currentPosition);
				// this.changeMainImage( event.target );
				removeEvent();
			};
			/**
    * On mouse move
    * @param event
    */
			var onMouseMove = function onMouseMove(event) {

				if (window.innerWidth >= 992) {
					return false;
				}

				if (event.type === 'touchmove') {
					var touch = event.touches[0];
					translateX = touch.clientX;
				} else {
					translateX = event.clientX;
				}

				var positionX = _this15.elementsPosition[_this15.currentPosition] - (translateX - startTranslateX) / 2;

				_this15.galleryMenu.style.WebkitTransition = '-webkit-transform ' + 0 + 'ms ' + 'linear';
				transition(_this15.galleryMenu, 'transform ' + 0 + 'ms ' + 'linear');

				transform(_this15.galleryMenu, has3d ? 'translate3d(' + -positionX + 'px, 0, 0)' : 'translateX(' + -positionX + 'px)');
			};
			/**
    * On mouse down
    * @param event
    */
			var onMouseDown = function onMouseDown(event) {

				if (window.innerWidth >= 992) {
					return false;
				}

				if (_this15.isAnimate) {
					return false;
				}

				_this15.isAnimate = true;

				transition(_this15.galleryMenu, 'none');

				if (event.type === 'touchstart') {
					var touch = event.touches[0];
					startX = touch.clientX;
				} else {
					startX = event.clientX;
					// event.preventDefault();
				}

				startTranslateX = startX;

				_this15.galleryMenu.addEventListener('mousemove', onMouseMove);
				_this15.galleryMenu.addEventListener('touchmove', onMouseMove);
				_this15.galleryMenu.addEventListener('mouseup', onMouseUp);
				_this15.galleryMenu.addEventListener('touchend', onMouseUp);
			};

			this.galleryMenu.addEventListener('mousedown', onMouseDown);
			this.galleryMenu.addEventListener('touchstart', onMouseDown);

			this.galleryMenu.addEventListener('mousewheel', function () {
				// console.log('mouse wheel');
			});
		}
	}, {
		key: 'onTransitionEnd',
		value: function onTransitionEnd() {
			this.isAnimate = false;
		}
	}, {
		key: 'resize',
		value: function resize() {
			var _this16 = this;

			window.addEventListener('resize', function () {
				if (window.innerWidth < 992) {
					_this16.setElements();
				} else {
					_this16.unSetElements();
				}
			});
		}
	}]);

	return LeftMenu;
})();

var Gallery = (function () {
	function Gallery() {
		var _this17 = this;

		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		_classCallCheck(this, Gallery);

		this.galleryName = options.gallery || '.gallery';

		this.gallery = document.querySelectorAll(this.galleryName);

		this.closeBtn = document.querySelector('.navigation-btn');

		if (this.gallery.length <= 0) {
			return false;
		}

		arrProto.forEach.call(this.gallery, function (gallery, index) {
			_this17.createGallery(gallery, index);
		});

		this.init();

		// window.addEventListener( 'resize', () =>
		// {
		// this.closeBtn = document.querySelector( '.navigation-btn' );
		// if ( this.closeBtn ) {
		// 	if ( this.closeBtn.getAttribute( 'data-action' ) === 'close-ajax-page' ) {
		// 		return;
		// 	}
		// }
		// this.deleteCloseBtn();
		// } );
	}

	/* Accordeon
 ----------------------------------------------------------------------*/
	/**
  * Cospo Accordeon
  */

	/**
  * Create gallery         [description]
  */

	_createClass(Gallery, [{
		key: 'createGallery',
		value: function createGallery(gallery, index) {
			var _this18 = this;

			gallery.classList.add('gallery');

			if (gallery.id) {
				gallery.id = gallery.id + ' gallery-' + index;
			} else {
				gallery.setAttribute('id', 'gallery-' + index);
			}

			var showItems = gallery.getAttribute('data-item');

			if (!showItems) {
				showItems = 5;
			}

			var items = gallery.querySelectorAll('li');

			if (!items) {
				return false;
			}

			var itemsLength = items.length;

			if (showItems >= itemsLength) {
				showItems = itemsLength;
			}

			if (!gallery.classList.contains('gallery-services')) {
				this.hide(gallery, itemsLength, showItems, items);
				galleryImg(gallery);
			}

			var t;

			window.addEventListener('resize', function () {
				clearInterval(t);
				if (!gallery.classList.contains('gallery-services')) {
					t = setTimeout(function () {
						_this18.hide(gallery, itemsLength, showItems, items);
						galleryImg(gallery);
					}, 300);
				}
			});

			this.onItemClick(gallery);
		}

		/**
   * Init Gallery
   */
	}, {
		key: 'init',
		value: function init() {
			var _this19 = this;

			var ajaxMenu = document.querySelectorAll('.ajax-menu');

			this.onFirstLoad();

			arrProto.forEach.call(ajaxMenu, function (menu) {
				_this19.clickLoadPage(menu);
			});
		}

		/**
   * Hide custom items
   * @param  {[type]} gallery node
   * @param  {[type]} itemsLength
   * @param  {[type]} showItems
   * @param  {[type]} items node
   */
	}, {
		key: 'hide',
		value: function hide(gallery, itemsLength, showItems, items) {

			var i = itemsLength;

			var remaningEl = gallery.querySelector('.show-remaning-el');
			if (remaningEl) {
				remaningEl.classList.remove('show-remaning-el');
			}

			if (window.innerWidth < 768) {
				showItems = 3;
			}

			gallery.style.display = 'none';

			var tempShowItems = showItems;
			for (; tempShowItems--;) {
				if (!items[tempShowItems]) {
					continue;
				}
				items[tempShowItems].style.display = '';
			}

			for (; i--;) {
				// i > showItems ? items[i].style.display = 'none'; : break;
				if (i >= showItems) {
					items[i].style.display = 'none';
				}

				var a = items[i].querySelector('a'),
				    span = document.createElement('span');

				if (!a) {
					continue;
				}

				var count = a.querySelector('.count-current');
				if (count) {
					continue;
				}
				span.classList.add('count-current');
				span.innerHTML = i + 1 + '-' + itemsLength;

				a.appendChild(span);
			}

			if (items[showItems - 1]) {
				items[showItems - 1].classList.add('show-remaning-el');
				var lastSpan = items[showItems - 1].querySelector('.count-more');
				if (!lastSpan) {
					var _a = items[showItems - 1].querySelector('a');
					lastSpan = document.createElement('span');
					lastSpan.classList.add('count-more');
					lastSpan.innerHTML = '+ ' + (itemsLength - showItems);
					_a.appendChild(lastSpan);
				}
			}

			gallery.style.display = '';
		}

		/**
   * Load page and send request
   */
	}, {
		key: 'onItemClick',
		value: function onItemClick(menu) {
			var _this20 = this;

			menu.addEventListener('click', function (event) {
				if (_this20.requestIsSending) {
					return false;
				}

				var target = event.target;

				if (target === event.currentTarget) {
					return false;
				}

				if (target.tagName !== 'A') {
					target = target.parentNode;
				}

				while (target.tagName !== 'A') {
					target = target.parentNode;
					if (!target) {
						return false;
					}
				}

				var action = target.getAttribute('data-action');

				if (!action) {
					return false;
				}

				event.preventDefault();

				var galleryId = event.currentTarget.getAttribute('id');

				_this20.gallery = document.getElementById(galleryId);

				var parentId = _this20.gallery.parentNode;

				while (!parentId.classList.contains('cospo-page')) {
					parentId = parentId.parentNode;

					if (parentId.tagName === 'BODY') {
						break;
					}
				}

				parentId = parentId.getAttribute('id');

				var id = pages.idArray.indexOf(parentId);

				if (id !== -1) {
					pages.currentPage = id;
					var hash = pages.idArray[id];
					if (window.history) {
						if (history.pushState) {
							history.pushState(null, null, '#' + hash);
						}
					} else {
						location.hash = hash;
					}
				}

				target.classList.add('loading');

				_this20.loadPage();
				_this20.sendRequest(action, galleryId, target);
			});
		}

		/**
   * [loadPage description] hz why
   */
	}, {
		key: 'loadPage',
		value: function loadPage() {
			this.createPage();
		}

		/**
   * Create all page
   */
	}, {
		key: 'createPage',
		value: function createPage() {
			var _this21 = this;

			this.mainBlock = document.createElement('section');

			var pageWidth = document.querySelector('.cospo-page');

			if (pageWidth && window.innerWidth >= 768) {
				this.mainBlock.style.width = pageWidth.clientWidth + 'px';
			}

			var menuOverlay = document.createElement('div');
			menuOverlay.classList.add('ajax-menu-overlay');

			this.mainBlock.appendChild(menuOverlay);

			this.contentPage = document.createElement('div');
			this.contentPage.classList.add('content');

			this.mainBlock.appendChild(this.contentPage);

			this.mainBlock.classList.add('cospo-page');
			this.mainBlock.classList.add('ajax-page');
			this.mainBlock.classList.add('ajax-page-dynamic');

			if (window.innerWidth < 992) {
				this.mainBlock.classList.add('ajax-page-mobile');
			}

			var pageId = pages.idArray[pages.currentPage];

			if (pageId) {
				pageId = '-' + pageId;
			} else {
				pageId = '';
			}

			var ajaxPage = document.getElementById('ajax-page' + pageId);

			if (ajaxPage) {
				ajaxPage.parentNode.removeChild(ajaxPage);
			}

			this.mainBlock.setAttribute('id', 'ajax-page' + pageId);

			/* if container has class blog create blog */
			/* new check */
			if (pages.contentPage[pages.currentPage].classList.contains('blog')) {
				this.createBlogPage();
				// this.sendRequest( action, galleryId );
				// return true;
			} else {

					this.createMenu();

					var main = document.querySelector('main');

					// if ( window.innerWidth >= 992 ) {
					var after = pages.contentPage[pages.currentPage].nextSibling;

					if (after) {
						main.insertBefore(this.mainBlock, after);
					} else {
						main.appendChild(this.mainBlock);
					}
					// } else {
					// 	document.body.appendChild( this.mainBlock );
					// }
				}

			setTimeout(function () {

				_this21.createCloseBtn();

				var nav = document.querySelector('.navigation');
				if (nav) {
					nav.classList.remove('enable-hover');
				}

				_this21.pageLoaded = true;

				var btn = document.querySelector('.navigation-btn');
				if (btn) {
					btn.classList.remove('hideMenu');
					// btn.setAttribute( 'data-action', 'close-ajax-page' );
				}

				// document.querySelector( 'main' ).classList.add( 'noScroll' );
				document.querySelector('main').classList.add('ajax-page-dymamic--opened');

				_this21.firstLoadContent = true;
			}, 100);
		}

		/**
   * Create close button
   */
	}, {
		key: 'createCloseBtn',
		value: function createCloseBtn() {
			// if ( !this.closeBtn ) {
			var closeBtn = this.closeBtn = document.querySelector('.navigation-btn');
			// 	if ( !this.closeBtn ) {
			// 		return;
			// 	}
			// }
			closeBtn.setAttribute('data-action', 'close-ajax-page');
			closeBtn['data-action'] = 'close-ajax-page';
		}

		/**
   * Delete close button
   */
	}, {
		key: 'deleteCloseBtn',
		value: function deleteCloseBtn() {
			var w = window.innerWidth;
			// if ( !this.closeBtn ) {
			var closeBtn = this.closeBtn = document.querySelector('.navigation-btn');
			if (!closeBtn) {
				return;
			}
			// }

			if (closeBtn.getAttribute('data-action') === 'close-ajax-page') {
				return false;
			}

			if (w >= 992) {
				closeBtn.setAttribute('data-action', 'go-next-page');
			} else {
				var nav = document.querySelector('.navigation');
				if (!nav) {
					return;
				}

				if (nav.classList.contains('open')) {
					closeBtn.setAttribute('data-action', 'close-menu');
				} else {
					closeBtn.setAttribute('data-action', 'show-menu');
				}
			}

			this.pageLoaded = false;
		}

		/**
   * Create left menu
   */
	}, {
		key: 'createMenu',
		value: function createMenu() {
			var _this22 = this;

			var mainDiv = document.createElement('aside'),
			    scrollWrapper = document.createElement('div'),
			    scrollDiv = document.createElement('div'),
			    centerDiv = document.createElement('div'),
			    helperDiv = document.createElement('div'),
			    menu = this.gallery.cloneNode(true);

			var cloneLi = menu.querySelectorAll('li');

			var loading = menu.querySelector('a.loading');
			if (loading) {
				loading.classList.remove('loading');
			}

			var i = this.gallery.querySelectorAll('li').length,
			    showItems = this.gallery.getAttribute('data-item') || 5;

			if (showItems > i) {
				showItems = i;
			}

			for (; i--;) {
				var item = cloneLi[i];
				if (i >= showItems) {
					item.style.display = '';
				}

				if (window.innerWidth >= 992) {
					item.className = 'col-md-6';
				} else {
					item.className = '';
				}
			}

			if (menu.classList.contains('gallery-services')) {
				menu.classList.add('icons');
			}

			menu.classList.add('aside-menu');
			mainDiv.classList.add('col-md-1', 'overflow-height', 'ajax-menu');
			scrollWrapper.classList.add('wrapper-scroll');
			scrollDiv.classList.add('scroll');
			centerDiv.classList.add('content-center');

			helperDiv.appendChild(menu);
			centerDiv.appendChild(helperDiv);
			scrollDiv.appendChild(centerDiv);
			scrollWrapper.appendChild(scrollDiv);
			mainDiv.appendChild(scrollWrapper);

			this.contentPage.appendChild(mainDiv);

			this.createContent();

			this.clickLoadPage(menu);

			var ajaxMenu = this.contentPage.querySelector('.ajax-menu');

			setTimeout(function () {
				// ajaxNav.push( new LeftMenu(
				// {
				// 	gallery: ajaxMenu
				// } ) );

				// create dynamic left menu
				_this22.leftMenu = new LeftMenu({
					gallery: ajaxMenu
				});

				galleryImg(menu);
			}, 200);
		}

		/**
   * Create content
   */
	}, {
		key: 'createContent',
		value: function createContent() {

			var mainDiv = document.createElement('div'),
			    scrollDiv = document.createElement('div');

			mainDiv.classList.add('col-md-5', 'ajax-load', 'ajax-content');
			scrollDiv.classList.add('scroll');

			mainDiv.appendChild(scrollDiv);

			if (this.contentPage) {
				this.contentPage.appendChild(mainDiv);
			}

			this.contentPageBlock = mainDiv;

			this.scrollPageBlock = scrollDiv;
		}
	}, {
		key: 'createBlogPage',
		value: function createBlogPage() {

			this.mainBlock = document.createElement('section');

			var pageWidth = document.querySelector('.cospo-page');

			if (pageWidth && window.innerWidth >= 768) {
				this.mainBlock.style.width = pageWidth.clientWidth + 'px';
			}

			this.contentPage = document.createElement('div');
			this.contentPage.classList.add('content');

			this.mainBlock.appendChild(this.contentPage);

			this.mainBlock.classList.add('cospo-page');
			this.mainBlock.classList.add('ajax-page');
			this.mainBlock.classList.add('ajax-page-post');

			if (window.innerWidth < 992) {
				this.mainBlock.classList.add('ajax-page-mobile');
			}

			var pageId = pages.idArray[pages.currentPage];

			if (pageId) {
				pageId = '-' + pageId;
			} else {
				pageId = '';
			}

			var ajaxPage = document.getElementById('ajax-page' + pageId);

			if (ajaxPage) {
				ajaxPage.parentNode.removeChild(ajaxPage);
			}

			this.mainBlock.setAttribute('id', 'ajax-page' + pageId);

			var main = document.querySelector('main');

			if (window.innerWidth >= 992) {
				var after = pages.contentPage[pages.currentPage].nextSibling;

				if (after) {
					main.insertBefore(this.mainBlock, after);
				} else {
					main.appendChild(this.mainBlock);
				}
			} else {
				main.appendChild(this.mainBlock);
			}

			this.createCloseBtn();

			this.pageLoaded = true;

			var btn = document.querySelector('.navigation-btn');
			if (btn) {
				btn.classList.remove('hideMenu');
			}

			document.querySelector('main').classList.add('noScroll');

			this.firstLoadContent = true;

			var mainDiv = document.createElement('div'),
			    scrollDiv = document.createElement('div');

			mainDiv.classList.add('col-md-6');
			mainDiv.classList.add('ajax-load');
			mainDiv.classList.add('ajax-content');
			scrollDiv.classList.add('scroll');

			mainDiv.appendChild(scrollDiv);

			if (this.contentPage) {
				this.contentPage.appendChild(mainDiv);
			}

			this.contentPageBlock = mainDiv;

			this.scrollPageBlock = scrollDiv;

			var nav = document.querySelector('.navigation');
			if (nav) {
				nav.classList.remove('enable-hover');
			}
		}

		/**
   * click to send request
   */
	}, {
		key: 'clickLoadPage',
		value: function clickLoadPage(menu) {
			var _this23 = this;

			menu.addEventListener('click', function (event) {
				if (_this23.requestIsSending) {
					return false;
				}

				var target = event.target;

				if (target === event.currentTarget) {
					return false;
				}

				if (target.tagName !== 'A') {
					target = target.parentNode;
				}

				while (target.tagName !== 'A') {
					target = target.parentNode;
					if (!target) {
						return false;
					}
				}

				event.preventDefault();

				if (target.classList.contains('active')) {
					return;
				}

				var active = event.currentTarget.querySelectorAll('a');
				if (active) {
					var i = active.length;
					for (; i--;) {
						active[i].classList.remove('active');
					}
				}

				target.classList.add('active');
				target.classList.add('loading');

				var action = target.getAttribute('data-action');

				if (!action) {
					return false;
				}

				var galleryId = event.currentTarget.getAttribute('id');

				if (window.innerWidth < 992) {
					page = target.parentNode;
					while (!page.classList.contains('ajax-page')) {
						page = page.parentNode;
						if (page.tagName === 'BODY') {
							return false;
						}
					}
				} else {
					var page = pages.contentPage[pages.currentPage];
				}

				if (page.classList.contains('ajax-page')) {

					_this23.contentPageBlock = page.querySelector('.ajax-content');
					if (!_this23.contentPageBlock) {

						var mainDiv = document.createElement('div'),
						    scrollDiv = document.createElement('div');

						mainDiv.classList.add('col-md-5');
						mainDiv.classList.add('ajax-load');
						mainDiv.classList.add('ajax-content');
						scrollDiv.classList.add('scroll');

						mainDiv.appendChild(scrollDiv);
						event.currentTarget.parentNode.appendChild(mainDiv);

						_this23.contentPageBlock = mainDiv;

						_this23.scrollPageBlock = scrollDiv;

						var menu = page.querySelector('.ajax-menu');
						if (menu) {
							menu.parentNode.appendChild(_this23.contentPageBlock);
						} else {
							console.error('Ajax page must contain "ajax-menu" , and a with data-action!!!');
						}
					}

					_this23.scrollPageBlock = _this23.contentPageBlock.querySelector('.scroll');

					if (!action) {
						action = page.querySelector('a');
						action = action.getAttribute('data-action');
					}

					_this23.animateHeight = true;
					_this23.sendRequest(action, galleryId, target);

					return;
				}

				_this23.sendRequest(action, galleryId, target);
			});
		}

		/**
   * SendRequest to load page
   * @param  {[type]} action
   * @param  {[type]} galleryId
   */
	}, {
		key: 'sendRequest',
		value: function sendRequest(action) {
			var _this24 = this;

			var galleryId = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];
			var target = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

			// prevent double request
			this.requestIsSending = true;

			var windowWidth = window.innerWidth;

			var doAction = action;

			if (galleryId) {
				doAction = galleryId + '/' + action;
				// action = action.replace(/\/\S+\//gi, '/');
			}

			// alert(action);

			// перевірити чи є target, then find content page
			var tmpContentPage = undefined;

			if (target && !this.contentPageBlock) {
				tmpContentPage = target.parentNode;
				while (!tmpContentPage.classList.contains('content')) {
					tmpContentPage = tmpContentPage.parentNode;
					if (tmpContentPage.tagName === 'BODY') {
						break;
					}
				}

				if (tmpContentPage.tagName !== 'BODY') {
					this.contentPageBlock = tmpContentPage.querySelector('.ajax-content');
				}
			}

			// if ( this.contentPageBlock ) {
			// 	if( this.contentPageBlock.parentNode ) {
			// 		// this.contentPage.classList.add('loading');

			// 		// if ( this.firstLoadContent ) {
			// 			var menu = this.contentPageBlock.parentNode.querySelector( '.ajax-menu' );
			// 			if( menu ) {

			// 					this.setActiveElement( action, menu );

			// 					var loading = menu.querySelector( 'a.loading' );
			// 					if ( loading ) {
			// 						loading.classList.remove( 'loading' );
			// 					}
			// 			}
			// 			this.firstLoadContent = false;
			// 		// }
			// 	}
			// }

			if (this.contentPageBlock) {
				var _parent = this.contentPageBlock.parentNode;
				if (_parent) {
					// parent.classList.add('loading');
				}
			}

			var xhr = new XMLHttpRequest();

			xhr.open('GET', 'ajax/' + action + '.html', true);

			xhr.onreadystatechange = function () {
				if (xhr.readyState !== 4) {
					return;
				}

				if (_this24.contentPageBlock) {
					_this24.contentPageBlock.classList.remove('ajax-loaded');
				}

				if (_this24.mainBlock) {
					if (_this24.mainBlock.classList.contains('ajax-page-post')) {
						if (_this24.contentPageBlock) {
							_this24.contentPageBlock.classList.add('ajax-loaded');
						}
					}
				}

				var page = pages.contentPage[pages.currentPage];
				_this24.pageTitle = page.querySelector('.page-title');
				var title = '';
				if (_this24.pageTitle) {
					title = _this24.pageTitle.outerHTML;
				}

				if (xhr.readyState === 4 && xhr.status === 200) {

					// add let ajaxTitle
					// check if exist
					// add class to hide
					// replace child
					// remove class to show
					// wts 0_o

					if (windowWidth < 992) {
						var parent;
						parent = _this24.contentPageBlock.parentNode;
						while (!parent.classList.contains('content')) {
							parent = parent.parentNode;
							if (!parent) {
								parent = false;
								break;
							}
						}
						if (parent) {
							var lastTitle = parent.querySelector('.ajax-gallery-title');
							if (lastTitle) {
								// lastTitle.parentNode.removeChild( lastTitle );
								lastTitle.classList.remove('ajax-gallery-title--opened');
							}

							var div = document.createElement('div');
							div.innerHTML = xhr.responseText;
							var ajaxTitle = div.querySelector('.ajax-gallery-title');
							if (ajaxTitle) {
								// ajaxTitle.classList.add('loading');
								// parent.insertBefore( ajaxTitle, parent.firstElementChild );
								setTimeout(function () {
									if (lastTitle) {
										try {
											parent.replaceChild(ajaxTitle, lastTitle);
										} catch (e) {
											parent.insertBefore(ajaxTitle, parent.firstElementChild);
										}
									} else {
										parent.insertBefore(ajaxTitle, parent.firstElementChild);
									}
									setTimeout(function () {
										ajaxTitle.classList.add('ajax-gallery-title--opened');
									}, 0);

									centerImage({
										block: ajaxTitle,
										nameClass: 'img'
									});

									// end with current request
								}, 400);
							}
						}
					}

					setTimeout(function () {

						if (_this24.contentPageBlock) {
							var _parent2 = _this24.contentPageBlock.parentNode;
							if (_parent2) {
								// parent.classList.remove('loading');
							}
						}

						// if( window.innerWidth < 992 ) {
						// if( this.mainBlock ) {
						// 	this.mainBlock.classList.add('ajax-page-mobile--loaded');
						// }
						// }

						if (galleryId) {
							pages.contentPage[pages.currentPage].classList.remove('current-page');
							_this24.mainBlock.classList.add('current-page');
						}

						_this24.scrollPageBlock.scrollTop = 0;

						_this24.scrollPageBlock.innerHTML = title + xhr.responseText;
						scroll.init(_this24.scrollPageBlock.parentNode);

						if (windowWidth >= 992) {
							if (_this24.mainBlock) {
								var ajaxTitle = _this24.mainBlock.querySelector('.ajax-gallery-title');
								if (ajaxTitle) {
									centerImage({
										block: ajaxTitle,
										nameClass: 'img'
									});
								}
							}
						}

						var imgs = _this24.contentPageBlock.querySelectorAll('img'),
						    imgsLength = undefined,
						    count = 0;
						if (imgs.length > 0) {
							imgsLength = imgs.length;
							arrProto.forEach.call(imgs, function (img) {
								var newImg = new Image();
								newImg.onload = function () {
									count++;
									if (count >= imgsLength) {
										scroll.init(_this24.scrollPageBlock.parentNode);
										_this24.contentPageBlock.classList.add('ajax-loaded');
										if (_this24.mainBlock) {
											_this24.mainBlock.classList.add('ajax-page-mobile--loaded');
										}
										if (target) {
											target.classList.remove('loading');
										}

										var _gallery = _this24.contentPageBlock.querySelectorAll('.gallery');
										if (_gallery.length > 0) {
											arrProto.forEach.call(_gallery, function (g) {
												centerImage({
													block: g,
													nameClass: 'img'
												});
											});
										}
									}
								};
								newImg.onerror = function () {
									count++;
									if (count >= imgsLength) {
										scroll.init(_this24.scrollPageBlock.parentNode);
										_this24.contentPageBlock.classList.add('ajax-loaded');
										if (_this24.mainBlock) {
											_this24.mainBlock.classList.add('ajax-page-mobile--loaded');
										}
										if (target) {
											target.classList.remove('loading');
										}

										var _gallery2 = _this24.contentPageBlock.querySelectorAll('.gallery');
										if (_gallery2.length > 0) {
											arrProto.forEach.call(_gallery2, function (g) {
												centerImage({
													block: g,
													nameClass: 'img'
												});
											});
										}
									}
								};
								newImg.src = img.src;
							});
						} else {
							scroll.init(_this24.scrollPageBlock.parentNode);
							_this24.contentPageBlock.classList.add('ajax-loaded');
							if (_this24.mainBlock) {
								_this24.mainBlock.classList.add('ajax-page-mobile--loaded');
							}
							if (target) {
								target.classList.remove('loading');
							}

							var _gallery3 = _this24.contentPageBlock.querySelectorAll('.gallery');
							if (_gallery3.length > 0) {
								arrProto.forEach.call(_gallery3, function (g) {
									centerImage({
										block: g,
										nameClass: 'img'
									});
								});
							}
						}

						if (_this24.contentPageBlock) {
							if (_this24.contentPageBlock.parentNode) {
								// this.contentPage.classList.add('loading');

								// if ( this.firstLoadContent ) {
								var menu = _this24.contentPageBlock.parentNode.querySelector('.ajax-menu');
								if (menu) {

									_this24.setActiveElement(action, menu);

									var loading = menu.querySelector('a.loading');
									if (loading) {
										loading.classList.remove('loading');
									}
								}
								_this24.firstLoadContent = false;
								// }
							}
						}

						iframeSize();
						// social likes delete if no need
						$.fn.socialLikes.defaults = {
							// change url
							// url: window.location.href.replace(window.location.hash, ''),
							url: window.location.href,
							title: document.title,
							counters: true,
							zeroes: false,
							wait: 500, // Show buttons only after counters are ready or after this amount of time
							timeout: 10000, // Show counters after this amount of time even if they aren’t ready
							popupCheckInterval: 500,
							singleTitle: 'Share'
						};
						$('.social-likes').socialLikes({ forceUpdate: true });
						$('.social-likes').on('popup_closed.social-likes', function (event, service) {
							// Request new counters
							$(event.currentTarget).socialLikes({ forceUpdate: true });

							// Or just increase the number
							// var counter = $(event.currentTarget).find('.social-likes__counter_' + service);
							// counter.text(+(counter.text()||0)+1).removeClass('social-likes__counter_empty');
						});

						_this24.requestIsSending = false;
					}, 400);
				} else {
					// on error
					_this24.requestIsSending = true;
				}

				_this24.pageTitle = null;
				var hash;
				var lastAction = location.hash.match(/\/\S+/ig);
				if (lastAction) {
					hash = location.hash.replace(lastAction, '/' + doAction);
					if (window.history) {
						if (history.pushState) {
							history.pushState(null, null, hash);
						}
					} else {
						location.hash = hash;
					}
				} else {
					hash = location.hash + '/' + doAction;
					if (window.history) {
						if (history.pushState) {
							history.pushState(null, null, hash);
						}
					} else {
						location.hash = hash;
					}
				}
			};

			xhr.send();
		}

		/**
   * Delete Page
   */
	}, {
		key: 'deletePage',
		value: function deletePage(target) {
			var _this25 = this;

			delete this.leftMenu;

			// this.deleteCloseBtn();
			if (window.innerWidth >= 992) {
				target.setAttribute('data-action', 'go-next-page');
			} else {
				target.setAttribute('data-action', 'show-menu');
			}

			pages.contentPage[pages.currentPage].classList.add('current-page');

			scroll.init(pages.contentPage[pages.currentPage]);

			if (this.mainBlock) {
				this.mainBlock.classList.remove('current-page');
				this.mainBlock.classList.remove('ajax-page-mobile--loaded');
			}

			var lastAction = location.hash.match(/\/\S+/ig);
			if (lastAction) {
				var hash = pages.idArray[pages.currentPage];
				if (window.history) {
					if (history.pushState) {
						history.pushState(null, null, '#' + hash);
					}
				} else {
					location.hash = hash;
				}
			}

			this.pageLoaded = false;
			/***************************************************************************/
			// ajaxNav.pop();

			setTimeout(function () {
				if (_this25.mainBlock) {
					if (_this25.mainBlock.parentNode) {
						_this25.mainBlock.parentNode.removeChild(_this25.mainBlock);
						_this25.mainBlock = null;
					}
				}
				var nav = document.querySelector('.navigation');
				if (nav) {
					nav.classList.add('enable-hover');
				}
				document.querySelector('main').classList.remove('ajax-page-dymamic--opened');
				document.querySelector('main').classList.remove('noScroll');
			}, 500);
		}

		/**
   * On first load
   */
	}, {
		key: 'onFirstLoad',
		value: function onFirstLoad() {
			var block = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

			delete this.leftMenu;

			var hash, action;

			var page;

			if (!block) {
				page = pages.contentPage[pages.currentPage];
				hash = location.hash;
				action = hash.match(/\/\S+/ig);
			} else {
				page = block;
			}

			// var isAjaxPage = page.querySelector('.ajax-menu') ? true : false;

			if (page.classList.contains('ajax-page')) {
				// if (isAjaxPage) {
				this.contentPageBlock = page.querySelector('.ajax-content');

				if (this.contentPageBlock) {
					return false;
				}

				this.createContent();
				var menu = page.querySelector('.ajax-menu');
				if (menu) {
					menu.parentNode.appendChild(this.contentPageBlock);
				} else {
					console.error('Ajax page must contain "ajax-menu" , and a with data-action!!!');
				}

				if (!action) {
					action = page.querySelector('a.active');
					if (!action) {
						action = page.querySelector('a');
					}
					action = action.getAttribute('data-action');
				} else {
					action = action.toString();
					action = action.substr(1);
				}

				var active_link = menu.querySelector('a.active');
				if (active_link) {
					active_link.classList.remove('active');
				}

				var activeLink = menu.querySelector('a[data-action="' + action + '"]');

				if (activeLink && !activeLink.classList.contains('active')) {

					var links = menu.querySelectorAll('a');

					var linkLength = 0;

					if (links) {
						linkLength = links.length;
					}

					for (var i = 0; i < linkLength; i++) {
						if (links[i].getAttribute('data-action') === action) {
							links[i].classList.add('active');
							linkLength = i;
							break;
						}
					}

					var ajaxMenu = document.querySelectorAll('.ajax-menu');

					var ajaxMenuLength = 0;

					if (ajaxMenu) {
						ajaxMenuLength = ajaxMenu.length;
					}

					for (i = 0; i < ajaxMenuLength; i++) {
						if (ajaxMenu[i] === menu) {
							break;
						}
					}

					if (window.ajaxNav) {
						if (ajaxNav[i]) {
							ajaxNav[i].goTo(linkLength, 0);
						}
					}
				}

				this.sendRequest(action);

				return true;
			}

			if (!action) {
				return false;
			}

			hash = hash.replace(action, '');

			action = action.toString();

			var galleryId;

			if (action.indexOf('blog-post') !== -1) {
				galleryId = '/blog-post/';
			} else {
				galleryId = action.match(/\/gallery-\d+\//gi);
			}

			if (!galleryId) {
				return false;
			}

			action = action.replace(galleryId, '');

			galleryId = galleryId.toString();
			galleryId = galleryId.replace(/\//gi, '');

			// if( galleryId.indexOf('blog-post') !== -1 ) {
			// 	this.createBlogPage();
			// 	this.sendRequest( action, galleryId );
			// 	return true;
			// }

			this.gallery = document.getElementById(galleryId);

			this.loadPage();
			this.sendRequest(action, galleryId);
		}
	}, {
		key: 'setActiveElement',
		value: function setActiveElement(action, menu) {
			/* Set Active */
			var ajaxMenu;
			var leftMenu = this.leftMenu;
			if (leftMenu) {
				ajaxMenu = leftMenu.gallery;
			} else {
				return false;
				ajaxMenu = menu ? menu : this.contentPage.querySelector('.ajax-menu');
			}

			if (!action) {
				return;
			}

			action = action.toString();
			action = action.replace(/^\//gi, '');
			action = action.replace(menu.id, '');
			action = action.replace(/^\//gi, '');

			var link = ajaxMenu.querySelectorAll('a');
			var linkLength = 0;

			if (link) {
				linkLength = link.length;
			}

			var ajaxMenuLength = ajaxMenu.length;

			var oldActive = ajaxMenu.querySelector('a.active');
			if (oldActive) {
				oldActive.classList.remove('active');
			}

			var linkWithAction = ajaxMenu.querySelector('a[data-action="' + action + '"]');

			var activeLink = Array.prototype.indexOf.call(link, ajaxMenu.querySelector('a[data-action="' + action + '"]'));

			if (activeLink !== undefined) {
				linkWithAction.classList.add('active');
				if (leftMenu.currentPosition > activeLink || leftMenu.items - 1 + leftMenu.currentPosition < activeLink) {
					leftMenu.goTo(activeLink, 0);
				}
			}
		}
	}, {
		key: 'clearLoading',
		value: function clearLoading(block) {
			if (!block) {
				return false;
			}
			var a = block.querySelectorAll('a.loading'),
			    l = a.length;
			if (l > 0) {
				for (; l--;) {
					a[l].classList.remove('loading');
				}
			}
		}
	}]);

	return Gallery;
})();

var Accordeon = (function () {
	function Accordeon() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		_classCallCheck(this, Accordeon);

		this.accordeon = options.accordeon || '.accordeon';
		this.scroll = options.scroll || null;

		this.accordeon = document.querySelectorAll(this.accordeon);

		if (!this.accordeon) {
			return false;
		}

		this.init();
	}

	/* Navigation
 ----------------------------------------------------------------------*/

	_createClass(Accordeon, [{
		key: 'init',
		value: function init() {
			var _this26 = this;

			arrProto.forEach.call(this.accordeon, function (elem, index) {

				var items = elem.querySelectorAll('.accordeon-item');

				arrProto.forEach.call(items, function (item) {
					item.addEventListener(transitionEvent, function () {
						_this26.onEndAnimation();
					});
				});

				elem.onclick = function (event) {
					var target = event.target;

					if (target.tagName === 'BUTTON') {
						var content = target.parentNode.querySelector('.accordeon-content');
						_this26.show(content, index);
					}
				};
			});

			window.addEventListener('resize', function () {

				if (_this26.lastOpen) {
					var content = _this26.lastOpen;
					if (content.classList.contains('show')) {
						content.classList.add('show');
						content.parentNode.classList.add('open');
						content.parentNode.style.height = content.offsetHeight + 'px';
						if (_this26.lastOpen && _this26.lastOpen !== content) {
							_this26.lastOpen.classList.remove('show');
							_this26.lastOpen.parentNode.classList.remove('open');
							_this26.lastOpen.parentNode.style.height = '';
						}

						_this26.lastOpen = content;
					}
				}
			});
		}
	}, {
		key: 'show',
		value: function show(content) {
			if (content.classList.contains('show')) {
				content.classList.remove('show');
				content.parentNode.classList.remove('open');
				content.parentNode.style.height = '';
			} else {
				content.classList.add('show');
				content.parentNode.classList.add('open');
				content.parentNode.style.height = content.offsetHeight + 'px';
				if (this.lastOpen && this.lastOpen !== content) {
					this.lastOpen.classList.remove('show');
					this.lastOpen.parentNode.classList.remove('open');
					this.lastOpen.parentNode.style.height = '';
				}

				this.lastOpen = content;
			}

			if (!animation) {
				this.onEndAnimation();
				return;
			}
		}
	}, {
		key: 'onEndAnimation',
		value: function onEndAnimation() {
			if (this.scroll) {
				this.scroll.init();
			}
		}
	}]);

	return Accordeon;
})();

var Navigation = (function () {
	function Navigation() {
		_classCallCheck(this, Navigation);

		this.menu = document.querySelector('.navigation');
	}

	/**************************************************/

	_createClass(Navigation, [{
		key: 'showMobile',
		value: function showMobile(target) {
			if (window.innerWidth < 992) {
				this.menu.classList.add('open');

				target = this.menu.querySelector('button[data-action="show-menu"]');
				if (!target) {
					return false;
				}

				target.setAttribute('data-action', 'close-menu');

				navCarousel.prevPosition = navCarousel.currentPosition;

				navCarousel.currentPosition = navCarousel.liLength - 1;

				var z = Math.ceil(navCarousel.countVisibleItem / 2);
				var page = pages.contentPage[pages.currentPage];
				var id = page.getAttribute('id');
				var link = navCarousel.lis[navCarousel.currentPosition + z].querySelector('a');
				var hash = link.getAttribute('href');
				hash = hash.replace('#', '');

				var _i5 = navCarousel.currentPosition + z;
				if (id !== hash || !hash) {
					for (; _i5 < navCarousel.allLiLength; _i5++) {
						var tmp = navCarousel.lis[_i5].querySelector('a');
						var tmpHash = tmp.getAttribute('href');
						hash = tmpHash.replace('#', '');
						if (id === hash) {
							break;
						}
					}
					navCarousel.currentPosition = _i5 - Math.floor(navCarousel.countVisibleItem / 2);
				} else {
					navCarousel.currentPosition = navCarousel.currentPosition + 1;
				}

				navCarousel.goTo(navCarousel.currentPosition, 1);
			} else {
				target = this.menu.querySelector('button[data-action="show-menu"]');
				if (!target) {
					return false;
				}
				target.setAttribute('data-action', 'go-next-page');
			}
		}
	}, {
		key: 'hideMobile',
		value: function hideMobile(target) {
			this.menu.classList.remove('open');
			this.menu.classList.remove('open-bottom');
			this.menu.classList.remove('open-top');

			var widgetBlockTop = document.querySelector('.widget-block-top');
			var widgetBlockBottom = document.querySelector('.widget-block-bottom');

			if (widgetBlockBottom) {
				widgetBlockBottom.classList.remove('opened');
			}
			if (widgetBlockTop) {
				widgetBlockTop.classList.remove('opened');
			}

			target = this.menu.querySelector('button[data-action="close-menu"]');
			if (!target) {
				return;
			}

			target.setAttribute('data-action', 'show-menu');
		}
	}]);

	return Navigation;
})();

var NavigationCarousel = (function () {
	function NavigationCarousel() {
		_classCallCheck(this, NavigationCarousel);

		this.resize();
	}

	/* Slider
 ----------------------------------------------------------------------*/
	/*
  * Cospo Slider
  */

	/**
  * Create carousel menu
  */

	_createClass(NavigationCarousel, [{
		key: 'carouselMenu',
		value: function carouselMenu() {
			var _this27 = this;

			// if( window.innerWidth < 992 ) {
			//   return false;
			// }

			this.navMenu = document.querySelector('.navigation-menu');
			if (!this.navMenu) {
				return false;
			}

			// let lis = this.navMenu.querySelectorAll( 'li' );
			// select all children
			var lis = this.navMenu.children;

			this.carouselInit = false;

			// set count of visible item
			var countVisibleItem = this.countVisibleItem = 5;

			if (lis.length < countVisibleItem) {
				countVisibleItem = this.countVisibleItem = lis.length;
			}

			if (countVisibleItem % 2 === 0) {
				countVisibleItem = this.countVisibleItem = countVisibleItem - 1;
			}

			if (lis.length < 3) {
				return false;
			}

			if (countVisibleItem < 3) {
				countVisibleItem = this.countVisibleItem = 3;
			}
			if (countVisibleItem < 0) {
				countVisibleItem = this.countVisibleItem = 3;
			}

			this.carouselInit = true;

			this.navMenu.classList.add('carousel-menu');

			// height li
			this.liHeight = lis[0].clientHeight;

			// full height
			this.fullHieght = this.liHeight * lis.length;
			// static height
			this.menuHeight = this.liHeight * lis.length * 3;

			this.liLength = lis.length;

			this.liPosition = [];

			// this.fragment = document.createDocumentFragment();;

			this.navMenu.style.height = this.menuHeight + 'px';

			var lisLength = lis.length;

			var docFrag1 = document.createDocumentFragment();
			var docFrag2 = document.createDocumentFragment();

			// clone li and add them before other li
			for (var _i6 = 0; _i6 < lisLength; _i6++) {
				lis[_i6].style.height = this.liHeight + 'px';
				var cloneNode = lis[_i6].cloneNode(true);
				var cloneNode2 = lis[_i6].cloneNode(true);
				// // let cloneNode3 = lis[i].cloneNode(true);
				cloneNode.classList.add('clones-attack');
				cloneNode2.classList.add('clones-attack');
				// // cloneNode3.classList.add('fragment');
				// // this.fragment.appendChild(cloneNode3);
				// this.navMenu.insertBefore( cloneNode, lis[ 0 ] );
				// this.navMenu.appendChild( cloneNode2 );

				docFrag1.appendChild(cloneNode);
				docFrag2.appendChild(cloneNode2);
			}

			this.navMenu.insertBefore(docFrag1, this.navMenu.firstChild);
			this.navMenu.appendChild(docFrag2);

			this.lis = this.navMenu.children;

			this.allLiLength = this.lis.length;

			var chekSubUl = function chekSubUl(li) {
				if (!li) {
					return false;
				}

				var ul = li.querySelector('ul');
				if (ul) {
					ul.classList.add('sub-ul');
					var a = li.querySelector('a');
					var _lis = ul.children;
					if (a) {
						a.classList.add('show-sub-menu');
					}
					if (_lis.length > 0) {
						for (var _i7 = 0; _i7 < _lis.length; _i7++) {
							chekSubUl(_lis[_i7]);
						}
					}
				}
			};

			for (var _i8 = 0; _i8 < this.allLiLength; _i8++) {
				this.liPosition.push(this.liHeight * _i8);

				chekSubUl(this.lis[_i8]);
			}

			this.parentHeight = this.liHeight * countVisibleItem;

			this.navMenu.parentNode.style.height = this.parentHeight + 'px';

			this.currentPosition = this.liLength - 1;

			var z = Math.floor(this.countVisibleItem / 2);
			var currentPage = pages.currentPage;
			if (currentPage >= pages.contentPageLength) {
				currentPage = 0;
			}
			var page = pages.contentPage[currentPage];
			var id = page.getAttribute('id');
			var link = this.lis[this.currentPosition + z].querySelector('a');
			var hash = link.getAttribute('href');
			hash = hash.replace('#', '');

			var i = this.currentPosition + z;
			if (id !== hash || !hash) {
				for (; i < this.allLiLength; i++) {
					var tmp = this.lis[i].querySelector('a');
					var tmpHash = tmp.getAttribute('href');
					hash = tmpHash.replace('#', '');
					if (id === hash) {
						break;
					}
				}
				this.currentPosition = i - Math.floor(this.countVisibleItem / 2);
			} else {
				this.currentPosition;
			}

			this.navMenu.style.WebkitTransition = '-webkit-transform ' + 0 + 'ms ';
			this.navMenu.style.transition = '-webkit-transform ' + 0 + 'ms ';
			transition(this.navMenu, 'transform ' + 0 + 'ms ');

			// change translateX
			transform(this.navMenu, has3d ? 'translate3d(0, ' + -this.liPosition[this.currentPosition] + 'px, 0)' : 'translateY(' + -this.liPosition[this.currentPosition] + 'px)');

			var openMenu = undefined,
			    closeMenu = undefined;

			this.navMenu.parentNode.addEventListener('mouseover', function (event) {
				event.preventDefault();
				if (_this27.isAnimate) {
					return false;
				}
				_this27.openFullMenu();
			}, true);

			this.navMenu.parentNode.addEventListener('mouseleave', function (event) {
				event.preventDefault();
				_this27.closeFullMenu();
			});

			document.addEventListener('touchstart', function (event) {
				var target = event.target;
				while (!target.classList.contains('navigation-menu')) {
					target = target.parentNode;
					if (target.tagName === 'BODY') {
						_this27.closeFullMenu();
						return false;
						break;
					}
				}
			});

			this.MouseTouchMove();

			this.changeClass();
		}
	}, {
		key: 'goNext',
		value: function goNext() {
			var isKey = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

			if (!this.carouselInit) {
				// pages.closeAjaxPage();
				pages.nextPage();
				return false;
			}

			if (pages.isAnimate || this.isAnimate) {
				return false;
			}

			if (this.isOpenFullMenu) {
				return false;
			}

			this.prevPosition = this.currentPosition;

			var z = Math.ceil(this.countVisibleItem / 2);
			var currentPage = pages.currentPage + 1;
			if (currentPage >= pages.contentPageLength) {
				currentPage = 0;
			}
			var page = pages.contentPage[currentPage];
			var id = page.getAttribute('id');
			var link = this.lis[this.currentPosition + z];
			var hash = '';
			if (link) {
				link = link.querySelector('a');
				hash = link.getAttribute('href');
			}
			hash = hash.replace('#', '');

			if (isKey) {
				var _i9 = this.currentPosition + z;
				if (id !== hash || !hash) {
					for (; _i9 < this.allLiLength; _i9++) {
						var tmp = this.lis[_i9].querySelector('a');
						var tmpHash = tmp.getAttribute('href');
						hash = tmpHash.replace('#', '');
						if (id === hash) {
							break;
						}
					}
					this.currentPosition = _i9 - Math.floor(this.countVisibleItem / 2);
				} else {
					this.currentPosition++;
				}
			} else {
				this.currentPosition++;
			}

			this.isChecked = true;

			this.goTo(this.currentPosition);

			if (id === hash) {
				if (window.pages) {
					// pages.closeAjaxPage();
					pages.nextPage();
				}
			}

			return true;
		}
	}, {
		key: 'goPrev',
		value: function goPrev() {
			var isKey = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

			if (!this.carouselInit) {
				// pages.closeAjaxPage();
				pages.nextPage();
				return false;
			}

			if (pages.isAnimate || this.isAnimate) {
				return false;
			}

			if (this.isOpenFullMenu) {
				return false;
			}

			this.prevPosition = this.currentPosition;

			var z = Math.ceil(this.countVisibleItem / 2);
			var currentPage = pages.currentPage - 1;
			if (currentPage < 0) {
				currentPage = pages.contentPageLength - 1;
			}
			var page = pages.contentPage[currentPage];
			var id = page.getAttribute('id');
			var link = this.lis[this.currentPosition + z].querySelector('a');
			var hash = link.getAttribute('href');
			hash = hash.replace('#', '');

			if (isKey) {
				var _i10 = this.currentPosition + z;
				if (id !== hash) {
					for (; _i10 >= 0; _i10--) {
						var tmp = this.lis[_i10].querySelector('a');
						var tmpHash = tmp.getAttribute('href');
						hash = tmpHash.replace('#', '');
						if (id === hash) {
							break;
						}
					}
					this.currentPosition = _i10 - Math.floor(this.countVisibleItem / 2);
				} else {
					this.currentPosition--;
				}
			} else {
				this.currentPosition--;
			}

			this.isChecked = true;

			this.goTo(this.currentPosition);

			if (id === hash) {
				if (window.pages) {
					// pages.closeAjaxPage();
					pages.prevPage();
				}
			}

			return true;
		}
	}, {
		key: 'goTo',
		value: function goTo(index) {
			var speed = arguments.length <= 1 || arguments[1] === undefined ? 500 : arguments[1];
			var animate = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

			this.currentPosition = index;

			this.isChecked = false;

			if (!this.carouselInit) {
				return false;
			}

			if (!animate) {
				if (pages.isAnimate || this.isAnimate) {
					return false;
				}
			}

			this.isAnimate = true;

			this.changeClass();

			if (!this.prevPosition) {
				this.prevPosition = 0;
			}
			this.animateMenu(this.prevPosition, this.currentPosition, speed);

			return true;
		}
	}, {
		key: 'onTransitionEnd',
		value: function onTransitionEnd(func) {
			if (typeof func === "function") {
				func();
			}

			if (window.innerWidth < 992) {
				return false;
			}

			if (this.isMove) {
				return false;
			}

			if (this.currentPosition <= Math.floor(this.liLength / 2)) {

				this.currentPosition = this.liLength + this.currentPosition;
				this.lastPosition = this.liPosition[this.currentPosition];

				this.navMenu.style.WebkitTransition = '-webkit-transform ' + 0 + 'ms ';
				this.navMenu.style.transition = '-webkit-transform ' + 0 + 'ms ';
				transition(this.navMenu, 'transform ' + 0 + 'ms ');

				// change translateX
				transform(this.navMenu, has3d ? 'translate3d(0, ' + -this.liPosition[this.currentPosition] + 'px, 0)' : 'translateY(' + -this.liPosition[this.currentPosition] + 'px)');
			} else if (this.currentPosition >= (this.liLength - 1) * 2) {

				this.currentPosition = this.currentPosition - this.liLength;

				this.lastPosition = this.liPosition[this.currentPosition];

				this.navMenu.style.WebkitTransition = '-webkit-transform ' + 0 + 'ms ';
				transition(this.navMenu, 'transform ' + 0 + 'ms ');

				// change translateX
				transform(this.navMenu, has3d ? 'translate3d(0, ' + -this.liPosition[this.currentPosition] + 'px, 0)' : 'translateY(' + -this.liPosition[this.currentPosition] + 'px)');
			}

			this.isAnimate = false;
		}
	}, {
		key: 'changeClass',
		value: function changeClass() {
			this.deleteClass();
			this.addClass();
		}
	}, {
		key: 'addClass',
		value: function addClass() {

			var items = Math.floor(this.countVisibleItem / 2);

			var currentPosition = this.currentPosition;
			if (currentPosition >= this.liLength) {
				currentPosition = currentPosition - this.liLength;
				if (currentPosition >= this.liLength) {
					currentPosition = currentPosition - this.liLength;
				}
			}

			var lisClass = '';
			for (var _i11 = 0; _i11 < this.countVisibleItem; _i11++) {
				var tmp = _i11;
				if (Math.abs(tmp - items) === 0) {
					lisClass = 'main-active';
				} else if (Math.abs(tmp - items) === 1) {
					lisClass = 'second-active';
				} else {
					lisClass = 'last-active';
				}

				if (this.lis[currentPosition + tmp]) {
					this.lis[currentPosition + tmp].classList.add(lisClass);
				}
				if (this.lis[currentPosition + this.liLength + tmp]) {
					this.lis[currentPosition + this.liLength + tmp].classList.add(lisClass);
				}
				if (this.lis[currentPosition + this.liLength * 2 + tmp]) {
					this.lis[currentPosition + this.liLength * 2 + tmp].classList.add(lisClass);
				}
			}
		}
	}, {
		key: 'deleteClass',
		value: function deleteClass() {

			var length = this.allLiLength,
			    lis = this.lis;

			for (; length--;) {
				lis[length].classList.remove('last-active');
				lis[length].classList.remove('second-active');
				lis[length].classList.remove('main-active');
			}
		}

		// open menushow full item in menu
	}, {
		key: 'openFullMenu',
		value: function openFullMenu() {

			if (window.innerWidth < 992) {
				return false;
			}

			if (this.isOpenFullMenu) {
				return false;
			}

			this.isOpenFullMenu = true;

			this.navMenu.parentNode.classList.add('mouse-over');

			if (this.liLength === this.countVisibleItem) {
				return false;
			}

			this.isOpenedMenu = true;

			this.oldCurrentPosition = this.currentPosition;

			var tempPosition = this.currentPosition;

			var n = Math.abs(this.countVisibleItem - this.liLength);
			n = Math.floor(n / 2);
			tempPosition = this.currentPosition = this.currentPosition - n;

			this.n = n;

			if (this.liLength % 2 === 0) {
				this.navMenu.parentNode.style.top = this.liHeight / 2 + 'px';
			}

			var speed = 0;

			this.navMenu.style.WebkitTransition = '-webkit-transform ' + speed + 'ms';
			this.navMenu.style.transition = '-webkit-transform ' + speed + 'ms';
			transition(this.navMenu, 'transform ' + speed + 'ms');

			// change translateX
			if (/MSIE 9/i.test(navigator.userAgent) || /MSIE 10/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent)) {
				transform(this.navMenu, 'translateY(' + -this.liPosition[tempPosition] + 'px)');
			} else {
				transform(this.navMenu, has3d ? 'translate3d(0, ' + -this.liPosition[tempPosition] + 'px, 0)' : 'translateY(' + -this.liPosition[tempPosition] + 'px)');
			}

			this.navMenu.parentNode.style.height = this.fullHieght + 'px';
		}

		// hide item
	}, {
		key: 'closeFullMenu',
		value: function closeFullMenu() {
			var _this28 = this;

			if (!this.isOpenFullMenu) {
				return false;
			} else if (window.innerWidth < 992) {
				return false;
			}

			this.isOpenedMenu = false;

			if (this.oldCurrentPosition) {
				this.currentPosition = this.oldCurrentPosition;
			}

			this.navMenu.parentNode.classList.remove('mouse-over');

			setTimeout(function () {

				if (_this28.isOpenedMenu) {
					return false;
				}

				_this28.navMenu.parentNode.style.height = _this28.parentHeight + 'px';
				if (_this28.liLength % 2 === 0) {
					_this28.navMenu.parentNode.style.top = '';
				}

				_this28.navMenu.style.WebkitTransition = '-webkit-transform ' + 0 + 'ms';
				_this28.navMenu.style.transition = '-webkit-transform ' + 0 + 'ms';
				transition(_this28.navMenu, 'transform ' + 0 + 'ms');

				// change translateX
				if (/MSIE 9/i.test(navigator.userAgent) || /MSIE 10/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent)) {
					transform(_this28.navMenu, 'translateY(' + -_this28.liPosition[_this28.currentPosition] + 'px)');
				} else {
					transform(_this28.navMenu, has3d ? 'translate3d(0, ' + -_this28.liPosition[_this28.currentPosition] + 'px, 0)' : 'translateY(' + -_this28.liPosition[_this28.currentPosition] + 'px)');
				}

				// setTimeout( () => {
				if (_this28.setPosition) {

					for (var _i12 = 0; _i12 < _this28.allLiLength; _i12++) {
						_this28.lis[_i12].classList.remove('main-active');
						_this28.lis[_i12].classList.remove('second-active');
						_this28.lis[_i12].classList.remove('last-active');
					}

					_this28.prevPosition = _this28.currentPosition;
					_this28.currentPosition = _this28.tempPosition;

					_this28.goTo(_this28.currentPosition, 500, true);

					_this28.setPosition = false;
				}

				_this28.isOpenFullMenu = false;

				// }, 300 );
			}, 300);
		}
	}, {
		key: 'setCurrentPosition',
		value: function setCurrentPosition(index, li, id) {
			this.setPosition = true;
			var firstPosition = index;

			// if( firstPosition < Math.abs(this.liLength / 2) ) {
			// 	firstPosition = this.currentPosition + firstPosition - 2;
			// } else {
			// 	firstPosition = this.currentPosition - firstPosition - 2;
			// }

			var i = undefined;
			for (i = 0; i < this.allLiLength; i++) {
				if (this.lis[i] === li) {
					break;
				}
			}

			// firstPosition = firstPosition + this.liLength - 2;
			// firstPosition = Math.abs(this.currentPosition - firstPosition);
			this.tempPosition = i - Math.floor(this.countVisibleItem / 2);
		}

		/**
   * MouseMove, TouchMove
   */
	}, {
		key: 'MouseTouchMove',
		value: function MouseTouchMove() {
			var _this29 = this;

			var start = null,
			    end = null,
			    changes = null,
			    curPos = null,
			    lastPos = null,
			    tmpLastPos = null,
			    position = null,
			    isTouchStart = false,
			    positionNull = this.allLiLength - this.liLength;

			this.positionFull = -this.liPosition[this.allLiLength - this.countVisibleItem];

			/* EVENT REMOVE */
			var moveEnd = function moveEnd(event) {

				if (!isTouchStart) {
					return false;
				}

				isTouchStart = false;

				if (event.type === 'touchmove') {
					end = event.targetTouches[0].pageY;
				}

				_this29.prevPosition = curPos;

				if (lastPos !== undefined) {
					_this29.currentPosition = lastPos;
				} else {
					_this29.currentPosition = curPos;
				}

				_this29.isMove = false;

				_this29.changeClass();

				_this29.goTo(_this29.currentPosition);

				event.target.removeEventListener('touchmove', moveMenu);
			};

			/* MOUSEMOVE, TOUCHMOVE */
			var moveMenu = function moveMenu(event) {

				end = event.targetTouches[0].pageY;

				if (position) {
					if (position > 0) {
						curPos = positionNull;

						start = end;
						end = event.targetTouches[0].pageY;
					} else if (position < _this29.positionFull) {

						// curPos = Math.ceil((curPos) / 2);
						curPos = lastPos - _this29.liLength - 1;

						start = end;
						end = event.targetTouches[0].pageY;
					}
				}

				changes = (end - start) / 4;

				position = -_this29.liPosition[curPos] + changes;

				transform(_this29.navMenu, has3d ? 'translate3d(0, ' + position + 'px, 0)' : 'translateY(' + position + 'px)');

				_this29.lastPosition = -position;

				var itemChange = changes / _this29.liHeight;

				if (changes > 0) {
					itemChange = Math.ceil(itemChange);
				} else if (changes < 0) {
					itemChange = Math.floor(itemChange);
				} else {
					itemChange = 0;
				}

				lastPos = curPos - itemChange;

				if (!tmpLastPos) {
					tmpLastPos = lastPos;
				} else if (lastPos !== tmpLastPos) {

					var tmpPos = undefined;

					if (lastPos >= _this29.liLength) {
						tmpPos = lastPos - _this29.liLength;
					} else {
						tmpPos = lastPos;
					}

					for (var _i13 = 0; _i13 < 3; _i13++) {
						if (_this29.lis[_i13 * _this29.liLength + tmpPos + 2]) {
							_this29.lis[_i13 * _this29.liLength + tmpPos + 2].classList.add('main-active');
							_this29.lis[_i13 * _this29.liLength + tmpPos + 2].classList.remove('last-active');
							_this29.lis[_i13 * _this29.liLength + tmpPos + 2].classList.remove('second-active');
						}
						if (_this29.lis[_i13 * _this29.liLength + tmpPos]) {
							_this29.lis[_i13 * _this29.liLength + tmpPos].classList.add('last-active');
							_this29.lis[_i13 * _this29.liLength + tmpPos].classList.remove('main-active');
							_this29.lis[_i13 * _this29.liLength + tmpPos].classList.remove('second-active');
						}
						if (_this29.lis[_i13 * _this29.liLength + tmpPos + 4]) {
							_this29.lis[_i13 * _this29.liLength + tmpPos + 4].classList.add('last-active');
							_this29.lis[_i13 * _this29.liLength + tmpPos + 4].classList.remove('main-active');
							_this29.lis[_i13 * _this29.liLength + tmpPos + 4].classList.remove('second-active');
						}
						if (_this29.lis[_i13 * _this29.liLength + tmpPos + 1]) {
							_this29.lis[_i13 * _this29.liLength + tmpPos + 1].classList.add('second-active');
							_this29.lis[_i13 * _this29.liLength + tmpPos + 1].classList.remove('main-active');
							_this29.lis[_i13 * _this29.liLength + tmpPos + 1].classList.remove('last-active');
						}
						if (_this29.lis[_i13 * _this29.liLength + tmpPos + 3]) {
							_this29.lis[_i13 * _this29.liLength + tmpPos + 3].classList.add('second-active');
							_this29.lis[_i13 * _this29.liLength + tmpPos + 3].classList.remove('main-active');
							_this29.lis[_i13 * _this29.liLength + tmpPos + 3].classList.remove('last-active');
						}
					}

					tmpLastPos = lastPos;
				}
			};

			/* MOUSEDOWN, TOUCHSTART */
			var onMenu = function onMenu(event) {

				if (_this29.isAnimate) {
					return false;
				}

				if (window.innerWidth > 991) {
					return false;
				}

				_this29.isMove = true;
				_this29.touchMove = true;
				curPos = _this29.currentPosition;

				var touch = event.targetTouches[0];
				start = touch.pageY;

				isTouchStart = true;

				event.target.addEventListener('touchmove', moveMenu);

				// document.addEventListener( 'touchmove', ( event ) => {
				//
				// });
			};

			this.navMenu.addEventListener('touchstart', onMenu);
			this.navMenu.addEventListener('touchend', moveEnd);

			// mousewheel

			var onWheel = function onWheel(e) {
				e = e || window.event;

				// wheelDelta не дает возможность узнать количество пикселей
				var delta = e.deltaY || e.detail || e.wheelDelta;

				if (delta > 0) {
					_this29.goNext();
				} else if (delta < 0) {
					_this29.goPrev();
				}

				e.preventDefault ? e.preventDefault() : e.returnValue = false;
			};

			var elem = this.navMenu;
			// if (elem.addEventListener) {
			// 	let elem = this.navMenu;
			//   if ('onwheel' in document) {
			//     // IE9+, FF17+, Ch31+
			//     elem.addEventListener("wheel", onWheel);
			//   }
			// 	else if ('onmousewheel' in document) {
			//     // устаревший вариант события
			//     elem.addEventListener("mousewheel", onWheel);
			//   }
			// 	else {
			//     // Firefox < 17
			//     elem.addEventListener("MozMousePixelScroll", onWheel);
			//   }
			// } else { // IE8-
			//   elem.attachEvent("onmousewheel", onWheel);
			// }
		}

		/*********************************************************/
	}, {
		key: 'animateMenu',
		value: function animateMenu(currentPosition, endPosition) {
			var _this30 = this;

			var speed = arguments.length <= 2 || arguments[2] === undefined ? this.speed : arguments[2];

			var startX = this.lastPosition || this.liPosition[currentPosition],
			    progressX = startX,
			    endX = this.liPosition[endPosition],
			    path = Math.abs(startX - endX);

			var goLeft = startX < endX;

			this.animate({
				duration: speed,
				timing: function timing(timeFraction) {
					return timeFraction;
					// timeFraction < 0.5 ? 4 * timeFraction * timeFraction * timeFraction :
					// 	( timeFraction - 1 ) * ( 2 * timeFraction - 2 ) * ( 2 * timeFraction - 2 ) + 1;
				},
				draw: function draw(progress) {

					progressX = goLeft ? startX + path * progress : startX - path * progress;

					transform(_this30.navMenu, has3d ? 'translate3d( 0, ' + -progressX + 'px, 0)' : 'translateY(' + -progressX + 'px)');

					_this30.lastPosition = progressX;

					if (progress >= 1) {
						_this30.isAnimate = false;
						_this30.onTransitionEnd();
					}
				}
			});
		}
	}, {
		key: 'animate',
		value: function animate(setting) {

			var start = new Date().getTime();

			// this.draw = window.requestAnimationFrame( animate );

			animate();

			function animate() {

				// timeFraction от 0 до 1
				var now = new Date().getTime();

				var timeFraction = (now - start) / setting.duration;

				if (timeFraction > 1) {
					timeFraction = 1;
				}
				// текущее состояние анимации
				var progress = setting.timing(timeFraction);
				setting.draw(progress);

				if (timeFraction < 1) {
					window.requestAnimationFrame(animate);
				}
			}
		}

		/*********************************************************/
	}, {
		key: 'resize',
		value: function resize() {
			var _this31 = this;

			var t = undefined;
			window.addEventListener('resize', function () {

				if (!_this31.carouselInit) {
					return;
				}

				clearTimeout(t);
				t = setTimeout(function () {

					_this31.liPosition = [];
					_this31.lis[0].style.height = '';

					_this31.navMenu.style.height = _this31.menuHeight + 'px';

					_this31.liHeight = _this31.lis[0].clientHeight;

					_this31.menuHeight = _this31.liHeight * _this31.liLength * 3;

					for (var _i14 = 0; _i14 < _this31.allLiLength; _i14++) {
						_this31.lis[_i14].style.height = _this31.liHeight + 'px';
						_this31.liPosition.push(_this31.liHeight * _i14);
					}

					_this31.parentHeight = _this31.liHeight * _this31.countVisibleItem;

					_this31.navMenu.parentNode.style.height = _this31.parentHeight + 'px';

					_this31.fullHieght = _this31.liHeight * _this31.liLength;

					_this31.currentPosition = _this31.liLength - 1;

					var z = Math.floor(_this31.countVisibleItem / 2);
					var currentPage = pages.currentPage;
					if (currentPage >= pages.contentPageLength) {
						currentPage = 0;
					}
					var page = pages.contentPage[currentPage];
					var id = page.getAttribute('id');
					var link = _this31.lis[_this31.currentPosition + z].querySelector('a');
					var hash = link.getAttribute('href');
					hash = hash.replace('#', '');

					var i = _this31.currentPosition + z;
					if (id !== hash || !hash) {
						for (; i < _this31.allLiLength; i++) {
							var tmp = _this31.lis[i].querySelector('a');
							var tmpHash = tmp.getAttribute('href');
							hash = tmpHash.replace('#', '');
							if (id === hash) {
								break;
							}
						}
						_this31.currentPosition = i - Math.floor(_this31.countVisibleItem / 2);
					} else {
						_this31.currentPosition;
					}

					_this31.navMenu.style.WebkitTransition = '-webkit-transform ' + 0 + 'ms ';
					_this31.navMenu.style.transition = '-webkit-transform ' + 0 + 'ms ';
					transition(_this31.navMenu, 'transform ' + 0 + 'ms ');

					// change translateX
					transform(_this31.navMenu, has3d ? 'translate3d(0, ' + -_this31.liPosition[_this31.currentPosition] + 'px, 0)' : 'translateY(' + -_this31.liPosition[_this31.currentPosition] + 'px)');

					_this31.positionFull = -_this31.liPosition[_this31.allLiLength - _this31.countVisibleItem];

					_this31.changeClass();
				}, 300);
			});
		}
	}]);

	return NavigationCarousel;
})();

var Slider = (function () {
	function Slider() {
		var _this32 = this;

		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		_classCallCheck(this, Slider);

		this.element = options.element;
		if (!this.element) {
			return false;
		}

		this.delay = options.delay || 300;
		this.speed = options.speed || 300;

		this.items = this.element.querySelectorAll('.item');
		if (!this.items) {
			return false;
		}

		this.animationPath = [];
		this.animationPath.push('translate(-150%, 0)');
		this.animationPath.push('translate(150%, 0)');
		this.animationPath.push('translate(0, 150%)');
		this.animationPath.push('translate(0, -150%)');

		arrProto.forEach.call(this.items, function (item) {
			var rand = Math.floor(Math.random() * (4 - 0) + 0);
			item.style.transform = _this32.animationPath[rand];
			item.style.webkitTransform = _this32.animationPath[rand];
		});

		this.init();
		this.setImageWidth();
		this.resize();
	}

	/* Full image
 ----------------------------------------------------------------------*/
	/* Scale image to full size */

	_createClass(Slider, [{
		key: 'init',
		value: function init() {
			var _this33 = this;

			var i = 0,
			    prev = i,
			    length = this.items.length;
			this.items[i].classList.add('active');

			this.animateSlide = function () {
				prev = i;
				i++;
				if (i >= length) {
					i = 0;
				}
				_this33.items[prev].style.transitionDuration = 0 + 'ms';
				_this33.items[prev].style.webkitTransitionDuration = 0 + 'ms';
				_this33.items[prev].style.transitionDelay = _this33.speed + 'ms';
				_this33.items[prev].style.webkitTransitionDelay = _this33.speed + 'ms';
				// setTimeout(()=>{
				var rand = Math.floor(Math.random() * (4 - 0) + 0);
				_this33.items[prev].style.transform = _this33.animationPath[rand];
				_this33.items[prev].style.webkitTransform = _this33.animationPath[rand];
				_this33.items[prev].classList.remove('active');
				// },0);

				_this33.items[i].style.transitionDuration = _this33.speed + 'ms';
				_this33.items[i].style.webkitTransitionDuration = _this33.speed + 'ms';
				_this33.items[i].style.transitionDelay = 0 + 'ms';
				_this33.items[i].style.webkitTransitionDelay = 0 + 'ms';
				_this33.items[i].classList.add('active');
			};

			// this.startSlide();
		}
	}, {
		key: 'startSlide',
		value: function startSlide() {
			if (this.isAnimate) {
				return false;
			}
			this.isAnimate = true;
			this.startInterval = setInterval(this.animateSlide, this.delay);
		}
	}, {
		key: 'stopSlide',
		value: function stopSlide() {
			if (!this.isAnimate) {
				return false;
			}
			this.isAnimate = false;
			clearInterval(this.startInterval);
		}
	}, {
		key: 'setImageWidth',
		value: function setImageWidth() {

			if (!this.items) {
				return;
			}

			// [].forEach.call( this.items, item => {
			// 	var img = item.querySelector( 'img' );
			//
			// 	if ( !img ) {
			// 		return false;
			// 	}
			//
			// 	var height = img.naturalHeight,
			// 		width = img.naturalWidth,
			// 		proportion = width / height,
			// 		parentWidth = item.clientWidth;
			//
			// 	if ( width >= height ) {
			// 		img.style.height = item.clientHeight + 'px';
			// 		img.style.width = item.clientHeight * proportion + 'px';
			// 		img.style.left = -( item.clientHeight * proportion - parentWidth ) / 2 + 'px';
			// 	} else {
			// 		img.style.width = item.clientWidth + 'px';
			// 		img.style.height = item.clientWidth / proportion + 'px';
			// 		img.style.top = -( item.clientWidth / proportion - item.clientHeight ) / 2 + 'px';
			// 	}
			//
			// } );
		}
	}, {
		key: 'resize',
		value: function resize() {
			var _this34 = this;

			window.addEventListener('resize', function () {
				_this34.setImageWidth();
			});
		}
	}]);

	return Slider;
})();

var FullImage = (function () {
	function FullImage() {
		_classCallCheck(this, FullImage);
	}

	_createClass(FullImage, [{
		key: 'init',
		value: function init(target) {
			var _this35 = this;

			var page = target.parentNode;

			if (page.classList.contains('contain-image')) {
				this.contain = true;
			}

			if (target.tagName !== 'img') {
				target = target.querySelector('img');
			}

			if (!target) {
				return false;
			}

			while (!page.classList.contains('cospo-page')) {
				page = page.parentNode;
				if (page.classList.contains('contain-image')) {
					this.contain = true;
				}
			}

			if (!page) {
				return false;
			}

			if (!this.contain) {
				this.contain = false;
			}

			target.classList.add('active');
			this.target = target;

			var images = page.querySelectorAll('.show-full img');

			if (!images.length) {
				return false;
			}

			setTimeout(function () {
				_this35.createFullImage(images);
			}, 0);

			this.fullImageResize();
		}
	}, {
		key: 'createFullImage',
		value: function createFullImage(images) {
			var _this36 = this;

			this.images = [];
			this.length = images.length;

			// create wrapper
			this.fullImageWrapper = document.createElement('div');
			this.fullImageWrapper.className = 'full-image-wrapper';
			// create block for list
			this.fullImageBlock = document.createElement('div');
			this.fullImageBlock.className = 'full-image-block';
			// create ul
			this.fullImageUl = document.createElement('ul');
			this.fullImageUl.className = 'full-image-ul';

			this.swipe();

			// this.div = document.createElement('div');
			// this.div.classList.add('show-full-image');

			// width of fullImageBlock
			// change on resize
			this.mainWidth = parseInt(window.innerWidth * 0.8, 10);
			this.mainHeight = parseInt(window.innerHeight * 0.8, 10);
			var widthUl = 0;

			this.position = [];

			// change on resize
			this.fullImageBlock.style.width = this.mainWidth + 'px';
			this.fullImageBlock.style.height = this.mainHeight + 'px';

			// create li with iamge
			arrProto.forEach.call(images, function (image, index) {
				if (image.classList.contains('active')) {
					_this36.currentImage = index;
				}

				var cloneImage = image.cloneNode(true);
				_this36.images.push(cloneImage);
				var li = document.createElement('li');

				// change on resize
				li.style.width = _this36.mainWidth + 'px';
				li.style.height = _this36.mainHeight + 'px';

				// this.centerImage ( cloneImage );
				// this.containImage( cloneImage );

				if (!_this36.contain) {
					_this36.centerImage(cloneImage);
				} else {
					_this36.containImage(cloneImage);
				}

				li.appendChild(cloneImage);
				_this36.fullImageUl.appendChild(li);
				widthUl = widthUl + _this36.mainWidth;

				_this36.position.push(index * _this36.mainWidth);
			});

			// change on resize
			this.fullImageUl.style.width = widthUl + 'px';
			this.fullImageUl.style.height = this.mainHeight + 'px';

			this.fullImageBlock.appendChild(this.fullImageUl);

			this.fullImageWrapper.appendChild(this.fullImageBlock);

			// create overlays
			this.leftOverlay = document.createElement('div');
			this.rightOverlay = document.createElement('div');

			this.leftOverlay.className = "left-overlay";
			this.rightOverlay.className = "right-overlay";

			// create vuttons
			this.buttonLeft = document.createElement('button');
			this.buttonRight = document.createElement('button');
			this.buttonClose = document.createElement('button');

			this.buttonLeft.classList.add('show-full-btn-left');
			this.buttonRight.classList.add('show-full-btn-right');
			this.buttonClose.classList.add('show-full-btn-close');

			this.buttonLeft.onclick = function () {
				_this36.preImage();
			};

			this.buttonRight.onclick = function () {
				_this36.nextImage();
			};

			this.buttonClose.onclick = function () {
				_this36.closeImage();
			};

			if (this.currentImage || this.currentImage === 0) {
				this.goTo(this.currentImage, 0);
			}

			// append child
			this.fullImageBlock.appendChild(this.leftOverlay);
			this.fullImageBlock.appendChild(this.rightOverlay);

			this.fullImageBlock.appendChild(this.buttonLeft);
			this.fullImageBlock.appendChild(this.buttonRight);
			this.fullImageBlock.appendChild(this.buttonClose);

			document.body.appendChild(this.fullImageWrapper);

			this.fullImageIsExist = true;

			var timer = null;
			this.fullImageWrapper.onmousemove = function () {
				_this36.fullImageWrapper.classList.add('onmouse-move');
				clearTimeout(timer);
				timer = setTimeout(function () {
					_this36.fullImageWrapper.classList.remove('onmouse-move');
				}, 1000);
			};

			this.buttonClose.onmouseover = function () {
				_this36.fullImageWrapper.classList.add('onmouse-over');
			};
			this.buttonClose.onmouseleave = function () {
				_this36.fullImageWrapper.classList.remove('onmouse-over');
			};

			this.buttonLeft.onmouseover = function () {
				_this36.fullImageWrapper.classList.add('onmouse-over');
				_this36.fullImageWrapper.classList.add('onmouse-over-left');
			};
			this.buttonLeft.onmouseleave = function () {
				_this36.fullImageWrapper.classList.remove('onmouse-over');
				_this36.fullImageWrapper.classList.remove('onmouse-over-left');
			};

			this.buttonRight.onmouseover = function () {
				_this36.fullImageWrapper.classList.add('onmouse-over');
				_this36.fullImageWrapper.classList.add('onmouse-over-right');
			};
			this.buttonRight.onmouseleave = function () {
				_this36.fullImageWrapper.classList.remove('onmouse-over');
				_this36.fullImageWrapper.classList.remove('onmouse-over-right');
			};

			setTimeout(function () {
				_this36.fullImageWrapper.classList.add('loaded');
				_this36.fullImageLoaded = true;

				_this36.fullImageWrapper.classList.add('onmouse-move');
				setTimeout(function () {
					_this36.fullImageWrapper.classList.remove('onmouse-move');
				}, 3000);
			}, 0);
		}
	}, {
		key: 'nextImage',
		value: function nextImage() {

			if (this.currentImage === this.length - 1) {
				return false;
			}

			this.previousImage = this.currentImage;
			this.currentImage++;

			if (this.currentImage >= this.length) {
				this.currentImage = this.length - 1;
				return false;
				// this.currentImage = 0;
			}

			this.goTo(this.currentImage);

			// this.images[this.currentImage].classList.add('active');
			// this.images[this.previousImage].classList.remove('active');
		}
	}, {
		key: 'preImage',
		value: function preImage() {

			if (this.currentImage === 0) {
				return false;
			}

			this.previousImage = this.currentImage;
			this.currentImage--;

			if (this.currentImage < 0) {
				this.currentImage = this.length - 1;
				return false;
				// this.currentImage = this.length - 1;
			}

			this.goTo(this.currentImage);

			// this.images[this.currentImage].classList.add('active');
			// this.images[this.previousImage].classList.remove('active');
		}
	}, {
		key: 'centerImage',
		value: function centerImage(img) {
			var _this37 = this;

			var newImage = new Image();

			newImage.onload = function () {
				var height = newImage.naturalHeight;
				var width = newImage.naturalWidth;

				var proportion = width / height;

				var imgWidth = _this37.mainHeight * proportion;
				var imgHeight = _this37.mainHeight;
				var top = 0;
				var left = 0;

				if (imgWidth < _this37.mainWidth) {
					imgWidth = _this37.mainWidth;
					imgHeight = imgWidth / proportion;
				}

				if (_this37.mainHeight < imgHeight) {
					top = -(imgHeight - _this37.mainHeight) / 2;
				}

				if (_this37.mainWidth < imgWidth) {
					left = -(imgWidth - _this37.mainWidth) / 2;
				}

				img.style.width = imgWidth + 'px';
				img.style.height = imgHeight + 'px';
				img.style.top = top + 'px';
				img.style.left = left + 'px';
				img.style.position = 'absolute';
				img.classList.add('image-loaded');
			};

			newImage.src = img.src;
		}
	}, {
		key: 'containImage',
		value: function containImage(img) {
			var height = img.naturalHeight;
			var width = img.naturalWidth;

			var proportion = width / height;

			var imgWidth = this.mainHeight * proportion;
			var imgHeight = this.mainHeight;
			var top = 0;
			var left = 0;

			if (imgWidth > this.mainWidth) {
				imgWidth = this.mainWidth;
				imgHeight = imgWidth / proportion;
			}

			if (this.mainHeight > imgHeight) {
				top = (this.mainHeight - imgHeight) / 2;
			}

			if (this.mainWidth > imgWidth) {
				left = (this.mainWidth - imgWidth) / 2;
			}

			img.style.width = imgWidth + 'px';
			img.style.height = imgHeight + 'px';
			img.style.top = top + 'px';
			img.style.left = left + 'px';
			img.style.position = 'absolute';
		}
	}, {
		key: 'goTo',
		value: function goTo(index, speed) {

			if (index < 0) {
				index = 0;
			}

			if (index >= this.length) {
				index = this.lenght - 1;
			}

			if (index === 0) {
				this.buttonLeft.classList.add('hide-btn');
				this.leftOverlay.classList.add('hide-overlay');
			} else {
				this.buttonLeft.classList.remove('hide-btn');
				this.leftOverlay.classList.remove('hide-overlay');
			}

			if (index === this.length - 1) {
				this.buttonRight.classList.add('hide-btn');
				this.rightOverlay.classList.add('hide-overlay');
			} else {
				this.buttonRight.classList.remove('hide-btn');
				this.rightOverlay.classList.remove('hide-overlay');
			}

			if (!speed && speed !== 0) {
				speed = 300;
			}

			if (this.previousImage) {
				if (this.images[this.previousImage]) {
					this.images[this.previousImage].classList.remove('active');
				}
			}
			this.images[index].classList.add('active');

			this.fullImageUl.style.WebkitTransition = '-webkit-transform ' + speed + 'ms ';
			transition(this.fullImageUl, 'transform ' + speed + 'ms ');

			transform(this.fullImageUl, has3d ? 'translate3d(' + -this.position[index] + 'px, 0, 0)' : 'translateX(' + -this.position[index] + 'px)');
		}
	}, {
		key: 'closeImage',
		value: function closeImage() {
			var _this38 = this;

			this.fullImageWrapper.classList.remove('loaded');
			this.contain = false;
			setTimeout(function () {
				_this38.target.classList.remove('active');
				_this38.fullImageWrapper.parentNode.removeChild(_this38.fullImageWrapper);
				_this38.fullImageIsExist = false;
			}, 300);
		}
	}, {
		key: 'fullImageResize',
		value: function fullImageResize() {
			var _this39 = this;

			window.addEventListener('resize', function () {
				if (!_this39.fullImageIsExist) {
					return false;
				}

				_this39.mainWidth = parseInt(window.innerWidth * 0.8, 10);
				_this39.mainHeight = parseInt(window.innerHeight * 0.8, 10);
				var widthUl = 0;

				_this39.position = [];

				// change on resize
				_this39.fullImageBlock.style.width = _this39.mainWidth + 'px';
				_this39.fullImageBlock.style.height = _this39.mainHeight + 'px';

				// create li with iamge
				arrProto.forEach.call(_this39.images, function (image, index) {

					if (image.classList.contains('active')) {
						_this39.currentImage = index;
					}

					// change on resize
					image.parentNode.style.width = _this39.mainWidth + 'px';
					image.parentNode.style.height = _this39.mainHeight + 'px';

					if (!_this39.contain) {
						_this39.centerImage(image);
					} else {
						_this39.containImage(image);
					}

					widthUl = widthUl + _this39.mainWidth;

					_this39.position.push(index * _this39.mainWidth);
				});

				// change on resize
				_this39.fullImageUl.style.width = widthUl + 'px';
				_this39.fullImageUl.style.height = _this39.mainHeight + 'px';

				_this39.goTo(_this39.currentImage);
			});
		}
	}, {
		key: 'swipe',
		value: function swipe() {
			var _this40 = this;

			var startX = null,
			    endX = null,
			    fullImageUl = this.fullImageUl;

			var touchend = function touchend(event) {
				if (endX) {
					if (startX - endX > 50) {
						_this40.nextImage();
					} else if (startX - endX < -50) {
						_this40.preImage();
					}
				}

				fullImageUl.ontouchmove = false;
			};
			var touchmove = function touchmove(event) {
				var touch = event.touches[0];
				endX = touch.clientX;
			};
			var touchstart = function touchstart(event) {
				endX = null;
				var touch = event.touches[0];
				startX = touch.clientX;
				fullImageUl.ontouchmove = touchmove;
			};

			fullImageUl.ontouchstart = touchstart;
			fullImageUl.ontouchend = touchend;
		}
	}]);

	return FullImage;
})();

var ShowFullImage = new FullImage();

/* Blog list
----------------------------------------------------------------------*/
/**
* Blog List
*/

var BlogList = (function () {
	function BlogList(block, request) {
		_classCallCheck(this, BlogList);

		// block where add list
		if (!block) {
			return false;
		}
		this.block = block;

		this.getList();
	}

	// new BlogList(document.body);

	/* Twitter fetcher
 ----------------------------------------------------------------------*/
	/*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
	/*********************************************************************
 *  #### Twitter Post Fetcher v15.0.1 ####
 *  Coded by Jason Mayes 2015. A present to all the developers out there.
 *  www.jasonmayes.com
 *  Please keep this disclaimer with my code if you use it. Thanks. :-)
 *  Got feedback or questions, ask here:
 *  http://www.jasonmayes.com/projects/twitterApi/
 *  Github: https://github.com/jasonmayes/Twitter-Post-Fetcher
 *  Updates will be posted to this site.
 *********************************************************************/

	/* send request to get list */

	_createClass(BlogList, [{
		key: 'getList',
		value: function getList() {
			var _this41 = this;

			var request = 'data/personal-man-blog.json';
			var xhr = new XMLHttpRequest();
			xhr.open('GET', request, true);
			xhr.send();
			xhr.onreadystatechange = function () {
				if (xhr.readyState !== 4) {
					return;
				}
				if (xhr.readyState === 4 && xhr.status === 200) {
					_this41.list = JSON.parse(xhr.responseText);
					_this41.showPost();
				}
			};
		}
	}, {
		key: 'showPost',
		value: function showPost() {
			for (var _i15 = 0; _i15 < this.list.length; _i15++) {
				console.log(this.list[_i15]);
				this.createPost(this.list[_i15]);
			}
		}
	}, {
		key: 'createPost',
		value: function createPost(item) {
			// create content
			var content = document.createElement('div');
			content.className = "content row blog-post";
			if (item.contentClass) {
				content.className += ' ' + item.contentClass;
			}

			// create image
			if (item.imgSrc) {
				var img = new Image();
				img.className = 'blog-post-bg';
				img.src = item.imgSrc;
				img.alt = '';
				content.appendChild(img);
			}

			// create content table and content cell bottom
			var contentTable = document.createElement('div');
			contentTable.className = 'col-md-5 content-table';

			// create footer
			var footer = document.createElement('div');
			footer.className = 'content-cell-bottom';

			// create h3
			var h3 = document.createElement('h3');
			if (item.title) {
				h3.innerHTML = item.title;
			}

			var time = item.time ? item.time : '';
			var author = item.author ? item.author : '';
			var tag = item.tag ? item.tag : '';

			footer.appendChild(h3);
			contentTable.appendChild(footer);
			content.appendChild(contentTable);
			console.log(content);
		}
	}]);

	return BlogList;
})();

(function (C, p) {
	"function" === typeof define && define.amd ? define([], p) : "object" === typeof exports ? module.exports = p() : p();
})(undefined, function () {
	function C(a) {
		if (null === r) {
			for (var g = a.length, c = 0, k = document.getElementById(D), f = "<ul>"; c < g;) f += "<li>" + a[c] + "</li>", c++;k.innerHTML = f + "</ul>";
		} else r(a);
	}function p(a) {
		return a.replace(/<b[^>]*>(.*?)<\/b>/gi, function (a, c) {
			return c;
		}).replace(/class="(?!(tco-hidden|tco-display|tco-ellipsis))+.*?"|data-query-source=".*?"|dir=".*?"|rel=".*?"/gi, "");
	}function E(a) {
		a = a.getElementsByTagName("a");
		for (var g = a.length - 1; 0 <= g; g--) a[g].setAttribute("target", "_blank");
	}function l(a, g) {
		for (var c = [], k = new RegExp("(^| )" + g + "( |$)"), f = a.getElementsByTagName("*"), h = 0, b = f.length; h < b; h++) k.test(f[h].className) && c.push(f[h]);return c;
	}function F(a) {
		if (void 0 !== a && 0 <= a.innerHTML.indexOf("data-srcset")) return a = a.innerHTML.match(/data-srcset="([A-z0-9%_\.-]+)/i)[0], decodeURIComponent(a).split('"')[1];
	}var D = "",
	    g = 20,
	    G = !0,
	    v = [],
	    x = !1,
	    y = !0,
	    w = !0,
	    z = null,
	    A = !0,
	    B = !0,
	    r = null,
	    H = !0,
	    I = !1,
	    t = !0,
	    J = !0,
	    K = !1,
	    m = null,
	    L = { fetch: function fetch(a) {
			void 0 === a.maxTweets && (a.maxTweets = 20);void 0 === a.enableLinks && (a.enableLinks = !0);void 0 === a.showUser && (a.showUser = !0);void 0 === a.showTime && (a.showTime = !0);void 0 === a.dateFunction && (a.dateFunction = "default");void 0 === a.showRetweet && (a.showRetweet = !0);void 0 === a.customCallback && (a.customCallback = null);void 0 === a.showInteraction && (a.showInteraction = !0);void 0 === a.showImages && (a.showImages = !1);void 0 === a.linksInNewWindow && (a.linksInNewWindow = !0);void 0 === a.showPermalinks && (a.showPermalinks = !0);void 0 === a.dataOnly && (a.dataOnly = !1);if (x) v.push(a);else {
				x = !0;D = a.domId;g = a.maxTweets;G = a.enableLinks;w = a.showUser;y = a.showTime;B = a.showRetweet;z = a.dateFunction;r = a.customCallback;H = a.showInteraction;I = a.showImages;t = a.linksInNewWindow;J = a.showPermalinks;K = a.dataOnly;var l = document.getElementsByTagName("head")[0];null !== m && l.removeChild(m);m = document.createElement("script");m.type = "text/javascript";m.src = "https://cdn.syndication.twimg.com/widgets/timelines/" + a.id + "?&lang=" + (a.lang || "en") + "&callback=twitterFetcher.callback&suppress_response_codes=true&rnd=" + Math.random();l.appendChild(m);
			}
		}, callback: function callback(a) {
			function m(a) {
				var b = a.getElementsByTagName("img")[0];b.src = b.getAttribute("data-src-2x");return a;
			}var c = document.createElement("div");c.innerHTML = a.body;"undefined" === typeof c.getElementsByClassName && (A = !1);a = [];var k = [],
			    f = [],
			    h = [],
			    b = [],
			    q = [],
			    n = [],
			    e = 0;if (A) for (c = c.getElementsByClassName("timeline-Tweet"); e < c.length;) {
				0 < c[e].getElementsByClassName("timeline-Tweet-retweetCredit").length ? b.push(!0) : b.push(!1);if (!b[e] || b[e] && B) a.push(c[e].getElementsByClassName("timeline-Tweet-text")[0]), q.push(c[e].getAttribute("data-tweet-id")), k.push(m(c[e].getElementsByClassName("timeline-Tweet-author")[0])), f.push(c[e].getElementsByClassName("dt-updated")[0]), n.push(c[e].getElementsByClassName("timeline-Tweet-timestamp")[0]), void 0 !== c[e].getElementsByClassName("timeline-Tweet-media")[0] ? h.push(c[e].getElementsByClassName("timeline-Tweet-media")[0]) : h.push(void 0);e++;
			} else for (c = l(c, "timeline-Tweet"); e < c.length;) {
				0 < l(c[e], "timeline-Tweet-retweetCredit").length ? b.push(!0) : b.push(!1);if (!b[e] || b[e] && B) a.push(l(c[e], "timeline-Tweet-text")[0]), q.push(c[e].getAttribute("data-tweet-id")), k.push(m(l(c[e], "timeline-Tweet-author")[0])), f.push(l(c[e], "dt-updated")[0]), n.push(l(c[e], "timeline-Tweet-timestamp")[0]), void 0 !== l(c[e], "timeline-Tweet-media")[0] ? h.push(l(c[e], "timeline-Tweet-media")[0]) : h.push(void 0);e++;
			}a.length > g && (a.splice(g, a.length - g), k.splice(g, k.length - g), f.splice(g, f.length - g), b.splice(g, b.length - g), h.splice(g, h.length - g), n.splice(g, n.length - g));var c = [],
			    e = a.length,
			    d = 0;if (K) for (; d < e;) c.push({ tweet: a[d].innerHTML, author: k[d].innerHTML, time: f[d].textContent, image: F(h[d]), rt: b[d], tid: q[d], permalinkURL: void 0 === n[d] ? "" : n[d].href }), d++;else for (; d < e;) {
				if ("string" !== typeof z) {
					var b = f[d].getAttribute("datetime"),
					    u = new Date(f[d].getAttribute("datetime").replace(/-/g, "/").replace("T", " ").split("+")[0]),
					    b = z(u, b);f[d].setAttribute("aria-label", b);if (a[d].textContent) if (A) f[d].textContent = b;else {
						var u = document.createElement("p"),
						    r = document.createTextNode(b);u.appendChild(r);u.setAttribute("aria-label", b);f[d] = u;
					} else f[d].textContent = b;
				}b = "";G ? (t && (E(a[d]), w && E(k[d])), w && (b += '<div class="user">' + p(k[d].innerHTML) + "</div>"), b += '<p class="tweet">' + p(a[d].innerHTML) + "</p>", y && (b = J ? b + ('<p class="timePosted"><a href="' + n[d] + '">' + f[d].getAttribute("aria-label") + "</a></p>") : b + ('<p class="timePosted">' + f[d].getAttribute("aria-label") + "</p>"))) : (w && (b += '<p class="user">' + k[d].textContent + "</p>"), b += '<p class="tweet">' + a[d].textContent + "</p>", y && (b += '<p class="timePosted">' + f[d].textContent + "</p>"));H && (b += '<p class="interact"><a href="https://twitter.com/intent/tweet?in_reply_to=' + q[d] + '" class="twitter_reply_icon"' + (t ? ' target="_blank">' : ">") + 'Reply</a><a href="https://twitter.com/intent/retweet?tweet_id=' + q[d] + '" class="twitter_retweet_icon"' + (t ? ' target="_blank">' : ">") + 'Retweet</a><a href="https://twitter.com/intent/favorite?tweet_id=' + q[d] + '" class="twitter_fav_icon"' + (t ? ' target="_blank">' : ">") + "Favorite</a></p>");I && void 0 !== h[d] && (b += '<div class="media"><img src="' + F(h[d]) + '" alt="Image from tweet" /></div>');
				c.push(b);d++;
			}C(c);x = !1;0 < v.length && (L.fetch(v[0]), v.splice(0, 1));
		} };return window.twitterFetcher = L;
});

/**
 * ### HOW TO CREATE A VALID ID TO USE: ###
 * Go to www.twitter.com and sign in as normal, go to your settings page.
 * Go to "Widgets" on the left hand side.
 * Create a new widget for what you need eg "user time line" or "search" etc.
 * Feel free to check "exclude replies" if you don't want replies in results.
 * Now go back to settings page, and then go back to widgets page and
 * you should see the widget you just created. Click edit.
 * Look at the URL in your web browser, you will see a long number like this:
 * 345735908357048478
 * Use this as your ID below instead!
 */

/**
 * How to use TwitterFetcher's fetch function:
 *
 * @function fetch(object) Fetches the Twitter content according to
 *     the parameters specified in object.
 *
 * @param object {Object} An object containing case sensitive key-value pairs
 *     of properties below.
 *
 * You may specify at minimum the following two required properties:
 *
 * @param object.id {string} The ID of the Twitter widget you wish
 *     to grab data from (see above for how to generate this number).
 * @param object.domId {string} The ID of the DOM element you want
 *     to write results to.
 *
 * You may also specify one or more of the following optional properties
 *     if you desire:
 *
 * @param object.maxTweets [int] The maximum number of tweets you want
 *     to return. Must be a number between 1 and 20. Default value is 20.
 * @param object.enableLinks [boolean] Set false if you don't want
 *     urls and hashtags to be hyperlinked.
 * @param object.showUser [boolean] Set false if you don't want user
 *     photo / name for tweet to show.
 * @param object.showTime [boolean] Set false if you don't want time of tweet
 *     to show.
 * @param object.dateFunction [function] A function you can specify
 *     to format date/time of tweet however you like. This function takes
 *     a JavaScript date as a parameter and returns a String representation
 *     of that date.
 * @param object.showRetweet [boolean] Set false if you don't want retweets
 *     to show.
 * @param object.customCallback [function] A function you can specify
 *     to call when data are ready. It also passes data to this function
 *     to manipulate them yourself before outputting. If you specify
 *     this parameter you must output data yourself!
 * @param object.showInteraction [boolean] Set false if you don't want links
 *     for reply, retweet and favourite to show.
 * @param object.showImages [boolean] Set true if you want images from tweet
 *     to show.
 * @param object.lang [string] The abbreviation of the language you want to use
 *     for Twitter phrases like "posted on" or "time ago". Default value
 *     is "en" (English).
 */

/* Sub menu
----------------------------------------------------------------------*/
/* Show sub menu in navigation-menu */

var SubULMenu = (function () {
	function SubULMenu() {
		_classCallCheck(this, SubULMenu);

		this.navMenu = document.querySelector('.navigation-menu');
		if (!this.navMenu) {
			return false;
		}

		this.menuWrapper = this.navMenu.parentNode;
		if (!this.menuWrapper) {
			return false;
		}
		this.div = this.menuWrapper.parentNode;
		if (!this.div) {
			return false;
		}

		this.div.classList.add('sub-nav');

		this.allUl = [];
		this.li = [];
	}

	/* Main functions
 ----------------------------------------------------------------------*/
	/* throttle js */

	_createClass(SubULMenu, [{
		key: 'showSubMenu',
		value: function showSubMenu(target) {
			var _this42 = this;

			if (!target) {
				return false;
			}

			this.targetParent = target.parentNode;

			if (this.targetParent.tagName !== "LI") {
				return false;
			}

			this.ul = this.targetParent.parentNode;

			if (this.ul.tagName !== "UL") {
				return false;
			}

			this.subUl = this.targetParent.querySelector('ul');

			if (!this.subUl) {
				return false;
			}

			this.div.classList.add('sub-nav-hide');

			setTimeout(function () {

				_this42.ul.classList.add('hide-menu');
				_this42.menuWrapper.classList.add('hide-menu');

				// this.menuWrapper.style.display = 'none';
				_this42.subUl.classList.add('show-menu');

				_this42.div.appendChild(_this42.subUl);

				_this42.allUl.push(_this42.subUl);
				_this42.li.push(_this42.targetParent);

				_this42.div.classList.remove('sub-nav-hide');
			}, 300);
		}
	}, {
		key: 'closeSubMenu',
		value: function closeSubMenu() {
			var _this43 = this;

			var ulLength = this.allUl.length;
			var liLength = this.li.length;

			if (ulLength <= 0) {
				return false;
			}

			this.div.classList.add('sub-nav-hide');

			setTimeout(function () {

				_this43.allUl[ulLength - 1].classList.remove('show-menu');

				if (_this43.allUl[ulLength - 2]) {
					_this43.allUl[ulLength - 2].classList.remove('hide-menu');
				}
				_this43.li[liLength - 1].appendChild(_this43.allUl[ulLength - 1]);

				if (ulLength === 1) {
					// this.menuWrapper.classList.remove('hide-menu');
					_this43.navMenu.classList.remove('hide-menu');
					// this.menuWrapper.style.display = '';
					_this43.menuWrapper.classList.remove('hide-menu');
					navCarousel.openFullMenu();
				}

				_this43.allUl.pop();
				_this43.li.pop();

				_this43.div.classList.remove('sub-nav-hide');
			}, 300);
		}
	}]);

	return SubULMenu;
})();

function throttle(func, ms) {

	var isThrottled = false,
	    savedArgs,
	    savedThis;

	function wrapper() {

		if (isThrottled) {
			// (2)
			savedArgs = arguments;
			savedThis = this;
			return;
		}

		func.apply(this, arguments); // (1)

		isThrottled = true;

		setTimeout(function () {
			isThrottled = false; // (3)
			if (savedArgs) {
				wrapper.apply(savedThis, savedArgs);
				savedArgs = savedThis = null;
			}
		}, ms);
	}

	return wrapper;
}

/* Set size for image in gallery */
function galleryImg(block) {

	if (!block) {
		return false;
	}

	scroll.init();

	var isBackground = !block.classList.contains('gallery');

	var imgs = block.querySelectorAll('img');

	if (imgs.length <= 0) {
		return false;
	}

	var setSize = function setSize(img, width, height, parentWidth) {
		var proportion = width / height,
		    parentHeight;

		if (isBackground) {
			if (img.parentNode) {
				parentHeight = img.parentNode.clientHeight;
			}
		} else {
			parentHeight = parentWidth;
		}

		var imgWidth = parentHeight * proportion;
		var imgHeight = parentHeight;
		var top = 0;
		var left = 0;

		if (imgWidth < parentWidth) {
			imgWidth = parentWidth;
			imgHeight = imgWidth / proportion;
		}

		if (parentHeight < imgHeight) {
			top = -(imgHeight - parentHeight) / 2;
		}

		if (parentWidth < imgWidth) {
			left = -(imgWidth - parentWidth) / 2;
		}

		img.style.width = imgWidth + 'px';
		img.style.height = imgHeight + 'px';
		img.style.top = top + 'px';
		img.style.left = left + 'px';
		img.style.position = 'absolute';

		if (img.parentNode) {
			img.parentNode.classList.remove('loading');
		}
	};

	arrProto.forEach.call(imgs, function (img) {
		img.parentNode.style.height = '';

		img.parentNode.classList.add('loading');

		resetStyle(img);

		var newImg = new Image();
		newImg.addEventListener('load', function () {
			var height = newImg.naturalHeight;
			var width = newImg.naturalWidth;

			if (!isBackground) {
				img.parentNode.style.height = '';
			}

			var parentWidth = img.parentNode.clientWidth;

			if (!isBackground) {
				if (parentWidth === 0) {
					var p = img.parentNode;
					var style = getComputedStyle(p);
					var w = style.width;
					w = w.replace('px', '');
					if (w.indexOf('%') !== -1) {
						w = 0;
					}
					parentWidth = w;
				}
			}

			if (!isBackground) {
				img.parentNode.style.height = parentWidth + 'px';
			}

			setTimeout(function () {
				setSize(img, width, height, parentWidth);
			}, 0);
		});
		newImg.src = img.src;

		function resetStyle(img) {
			img.style.width = '';
			img.style.height = '';
			img.style.top = '';
			img.style.left = '';
			img.style.position = '';
		}
	});
}

/* Video disable sound */
function disableVideoSound(elem) {

	if (!elem) {
		return false;
	}

	var length = elem.length;
	for (; length--;) {
		elem[length].muted = "muted";
		elem[length].play();
	}
}

// on popstate page
function popstatePage() {
	window.onpopstate = function (event) {
		// console.log(("location: " + document.location + ", state: " + JSON.stringify(event.state)));

		if (pages.isAnimate) {
			event.preventDefault();
		}

		isOnpopstate = false;

		var hash = location.hash;
		var action = hash.match(/\/\S+/ig);

		hash = hash.replace('#', '');
		hash = hash.replace(action, '');

		var index = pages.idArray.indexOf(hash);

		if (index !== -1) {

			if (pages.currentPage !== index) {

				pages.closeAjaxPage();

				if (window.gallery) {
					gallery.deleteCloseBtn();
				}

				pages.goTo(index);

				if (window.innerWidth < 992) {
					pages.animateScrollTop(index);
				}
			}
		}

		gallery.onFirstLoad();
	};
}

// main html5 block scroll
function mainScroll() {
	// return false;
	var main = document.querySelector('main');
	if (main) {
		(function () {

			var scrollBg = function scrollBg(target) {

				if (target.classList.contains('ajax-page-dymamic--opened')) {
					return false;
				}

				if (target.classList.contains('animateScrollTop')) {
					return false;
				}

				var Ww = window.innerWidth;

				if (Ww < 992) {

					var scrollTop = target.scrollTop,
					    scrollHeight = target.scrollHeight,
					    height = target.clientHeight;

					pages.tabletBackground(scrollTop, scrollHeight, height);

					if (Ww < 768) {

						if (!showMenuBtn) {
							return;
						}

						var attrAction = showMenuBtn.getAttribute('data-action');

						if (attrAction === 'close-ajax-page') {
							return;
						}

						if (!lastScrollTop) {
							lastScrollTop = scrollTop;
						}

						if (!pages.onLinkScroll) {
							if (lastScrollTop < scrollTop) {
								showMenuBtn.classList.add('hideMenu');
							} else {
								showMenuBtn.classList.remove('hideMenu');
							}
						}

						lastScrollTop = scrollTop;
					}
				}
			};

			scrollBg(main);
			var t = undefined;
			main.addEventListener('scroll', function (event) {
				// event.stopPropagation();
				// event.preventDefault();
				var target = event.currentTarget;
				clearTimeout(t);
				t = setTimeout(function () {
					scrollBg(target);
				}, 300);
			});

			main.addEventListener('touchmove', function (event) {
				event.stopPropagation();
			});
		})();
	}
}

// load all static ajax page
function loadAllStaticAjaxPage() {
	// вибрати усі aside-menu або ajax-menu
	// знайти елемент з класом active або перший елемент
	// послати запит на завантаження сторінки
	// створти і завантажити сторінку
	var ajaxPage = document.querySelectorAll('.ajax-page');
	if (ajaxPage.length > 0) {
		arrProto.forEach.call(ajaxPage, function (page) {

			if (page.classList.contains('ajax-page-dynamic')) {
				return false;
			}

			var ajaxMenu = page.querySelector('.ajax-menu');

			if (!ajaxMenu) {
				return false;
			}

			var contentPage = ajaxMenu.parentNode;

			if (!contentPage) {
				return false;
			}

			var mainDiv = contentPage.querySelector('.ajax-content');
			if (mainDiv) {
				return false;
			}

			var activeEl = ajaxMenu.querySelector('a.active');

			if (!activeEl) {
				activeEl = ajaxMenu.querySelector('a');
				if (!activeEl) {
					return false;
				}
			}

			var action = activeEl.getAttribute('data-action');

			if (!action) {
				return false;
			}

			/*************************************************/

			mainDiv = document.createElement('div');

			var scrollDiv = document.createElement('div');

			mainDiv.classList.add('col-md-5');
			mainDiv.classList.add('ajax-load');
			mainDiv.classList.add('ajax-loaded');
			mainDiv.classList.add('ajax-content');
			scrollDiv.classList.add('scroll');

			mainDiv.appendChild(scrollDiv);

			var pageTitle = page.querySelector('.page-title');
			var title = '';
			if (pageTitle) {
				title = pageTitle.outerHTML;
			}

			// this.contentPage.appendChild( mainDiv );
			/*************************************************/
			var xhr = new XMLHttpRequest();

			var currentHash = location.hash;

			xhr.open('GET', 'ajax/' + action + '.html', true);
			xhr.send();
			location.hash = currentHash;
			/*************************************************/
			xhr.onreadystatechange = function () {
				if (xhr.readyState !== 4) {
					return false;
				}

				if (xhr.readyState === 4 && xhr.status === 200) {

					var div = document.createElement('DIV');
					scrollDiv.innerHTML = title + xhr.responseText;
					contentPage.appendChild(mainDiv);
				}
			};
		});
	}
}

// scale blocks
function scaleMenuBlocks() {
	var scaleNavBg = function scaleNavBg() {

		var scaleF = function scaleF(block, scaleBlock) {

			// if ( window.innerWidth < 992 ) {
			// 	transform( scaleBlock, 'scale(' + 1 + ')' );
			// 	return false;
			// }

			var navW = undefined,
			    navH = undefined,
			    wW = window.innerWidth;

			if (wW >= 992) {
				navW = block.clientWidth;
				navH = block.clientHeight;
			} else {
				navW = wW;
				navH = window.innerHeight;
			}

			var radius = parseInt(Math.sqrt(navW * navW + navH * navH), 10);

			var size = navH;
			if (navH < navW) {
				size = navW;
			}

			size = radius + radius;

			scaleBlock.style.width = size + 'px';
			scaleBlock.style.height = size + 'px';

			if (wW >= 992) {
				scaleBlock.style.left = -size / 2 + 'px';
				scaleBlock.style.top = -size / 2 + navH / 2 + 'px';
			} else if (wW >= 768) {
				scaleBlock.style.left = -size / 2 + navW * 0.855 + 'px';
				scaleBlock.style.top = -size / 2 + 55 + 'px';
			} else {
				scaleBlock.style.left = -size / 2 + navW - 40 + 'px';
				scaleBlock.style.top = -size / 2 + 55 + 'px';
			}
		};

		// nav bg
		var nav = document.querySelector('.navigation nav');
		if (nav) {
			var scales = nav.querySelector('.scales');
			if (scales) {
				scaleF(nav, scales);
			}
		}
	};

	scaleNavBg();

	window.addEventListener('resize', scaleNavBg);

	// scale widget bg
	var scaleWidgetLang = function scaleWidgetLang() {
		var scaleF = function scaleF(block, scaleBlock) {

			var navW = undefined,
			    navH = undefined,
			    wW = window.innerWidth;

			if (wW >= 992) {
				navW = block.clientWidth;
				navH = block.clientHeight;
			} else {
				navW = wW;
				navH = window.innerHeight;
			}

			var radius = parseInt(Math.sqrt(navW * navW + navH * navH), 10);

			var size = radius + radius;

			scaleBlock.style.width = size + 'px';
			scaleBlock.style.height = size + 'px';

			if (block.classList.contains('widget-block-bottom')) {
				scaleBlock.style.left = -size / 2 + navW / 2 + 'px';
				scaleBlock.style.top = -size / 2 + navH - 61 + 'px';
			} else if (block.classList.contains('widget-block-top')) {
				scaleBlock.style.left = -size / 2 + navW / 2 + 'px';
				scaleBlock.style.top = -size / 2 + 65 + 'px';
			} else if (block.classList.contains('widget-search')) {
				scaleBlock.style.left = -size / 2 + navW - 67.5 + 'px';
				scaleBlock.style.top = -size / 2 + 65 + 'px';
			} else if (block.classList.contains('widget-lang')) {
				var _parent3 = block.parentNode;
				if (_parent3) {
					if (_parent3.classList.contains('widget-block-top')) {
						scaleBlock.style.left = -size / 2 + 67.5 + 'px';
						scaleBlock.style.top = -size / 2 + 65 + 'px';
					} else {
						if (wW >= 992) {
							scaleBlock.style.left = -size / 2 + navW / 2 + 'px';
							scaleBlock.style.top = -size / 2 + 61 + 'px';
						} else {
							scaleBlock.style.left = -size / 2 + 16 + 'px';
							scaleBlock.style.top = -size / 2 + 61 + 'px';
						}
					}
				}
			} else {
				scaleBlock.style.left = -size / 2 + navW / 2 + 'px';
				scaleBlock.style.top = -size / 2 + navH / 2 + 'px';
			}
		};

		// lang bg
		var nav = document.querySelector('.widget-lang');
		if (nav) {
			var scales = nav.querySelector('.widget-overlay');
			if (scales) {
				scaleF(nav, scales);
			}
		}

		var search = document.querySelector('.widget-search');
		if (search) {
			var scales = search.querySelector('.widget-search-overlay');
			if (scales) {
				scaleF(search, scales);
			}
		}

		// widget top bg
		var widgetTop = document.querySelector('.widget-block-top');
		if (widgetTop) {
			var widgetTopLayer = document.querySelector('.widget-overlay-top');
			if (widgetTopLayer) {
				scaleF(widgetTop, widgetTopLayer);
			}
		}

		// widget bottom bg
		var widgetBottom = document.querySelector('.widget-block-bottom');
		if (widgetBottom) {
			var widgetBottomLayer = document.querySelector('.widget-overlay-bottom');
			if (widgetBottomLayer) {
				scaleF(widgetBottom, widgetBottomLayer);
			}
		}

		var widgetLang = document.querySelector('.widget-lang');
		if (widgetLang) {
			var widgetLangOverlay = widgetLang.querySelector('.widget-lang-overlay');
			if (widgetLangOverlay) {
				scaleF(widgetLang, widgetLangOverlay);
			}
		}
	};

	scaleWidgetLang();
	window.addEventListener('resize', scaleWidgetLang);

	var navigationBlock = document.querySelector('.navigation');

	// navigationBlock.addEventListener('touchmove', event => {
	// 	event.stopPropagation();
	// } );
	// widget bottom
	var showWidgetBototm = document.querySelector('button[data-action="show-widget-bottom"]'),
	    widgetBlockBottom = undefined;
	if (showWidgetBototm) {

		widgetBlockBottom = document.querySelector('.widget-block-bottom');

		widgetBlockBottom.addEventListener('touchmove', function (event) {
			event.stopPropagation();
		});

		if (!widgetBlockBottom) {
			return false;
		}

		var showLang = false;

		showWidgetBototm.onclick = function () {
			if (widgetBlockBottom.classList.contains('opened')) {
				widgetBlockBottom.classList.remove('opened');
				if (navigationBlock) {
					navigationBlock.classList.remove('open-bottom');
				}
				setTimeout(function () {
					document.body.scrollTop = 0;
				}, 0);
			} else {
				widgetBlockBottom.classList.add('opened');
				if (navigationBlock) {
					navigationBlock.classList.add('open-bottom');
				}
			}
			showLang = true;
		};
	}
	// widget top
	var showWidgetTop = document.querySelector('button[data-action="show-widget-top"]'),
	    widgetBlockTop = undefined;
	if (showWidgetTop) {

		widgetBlockTop = document.querySelector('.widget-block-top');

		if (!widgetBlockTop) {
			return false;
		}

		var showLang = false;

		showWidgetTop.onclick = function () {
			if (widgetBlockTop.classList.contains('opened')) {
				widgetBlockTop.classList.remove('opened');
				if (navigationBlock) {
					navigationBlock.classList.remove('open-top');
				}
			} else {
				widgetBlockTop.classList.add('opened');
				if (navigationBlock) {
					navigationBlock.classList.add('open-top');
				}
			}
			showLang = true;
		};
	}

	if (navigationBlock) {
		navigationBlock.classList.add('enable-hover');
		navigationBlock.onmouseleave = function () {
			navigationBlock.classList.remove('open-bottom');
			if (widgetBlockBottom) {
				widgetBlockBottom.classList.remove('opened');
				navigationBlock.classList.remove('open-bottom');
			}
			if (widgetBlockTop) {
				widgetBlockTop.classList.remove('opened');
				navigationBlock.classList.remove('open-top');
			}
		};
		document.addEventListener('touchstart', function (event) {
			var target = event.target;
			while (!target.classList.contains('navigation')) {
				target = target.parentNode;
				if (target.tagName === 'BODY') {
					navigationBlock.classList.remove('open-bottom');
					if (widgetBlockBottom) {
						widgetBlockBottom.classList.remove('opened');
						navigationBlock.classList.remove('open-bottom');
					}
					if (widgetBlockTop) {
						widgetBlockTop.classList.remove('opened');
						navigationBlock.classList.remove('open-top');
					}
					return false;
				}
			}
		});
	}

	// alone widget lang
	var widgetLang = document.querySelector('.widget-lang'),
	    widgetLangBtn = undefined;

	if (widgetLang) {
		var _ret2 = (function () {
			widgetLangBtn = document.querySelector('button[data-action="show-lang"]');

			if (!widgetLangBtn) {
				return {
					v: false
				};
			}

			var topBtn = document.querySelector('button[data-action="show-widget-top"]');

			widgetLangBtn.onclick = function () {
				widgetLang.classList.add('opened-lang');
				if (topBtn) {
					topBtn.classList.add('hide');
				}
			};

			widgetLang.onmouseleave = function () {
				widgetLang.classList.remove('opened-lang');
				if (topBtn) {
					topBtn.classList.remove('hide');
				}
			};

			navigationBlock.addEventListener('touchstart', function () {
				widgetLang.classList.remove('opened-lang');
				if (topBtn) {
					topBtn.classList.remove('hide');
				}
			});
			// if( widgetBlockTop ) {
			// 	widgetBlockTop.addEventListener('touchstart', ()=>{
			// 		widgetLang.classList.remove('opened-lang');
			// 	});
			// }
		})();

		if (typeof _ret2 === 'object') return _ret2.v;
	}

	/* SEARCH */
	var widgetSearch = document.querySelector('.widget-search'),
	    widgetSearchBtn = undefined;

	if (widgetSearch) {
		var _ret3 = (function () {
			widgetSearchBtn = document.querySelector('button[data-action="show-search"]');

			if (!widgetSearchBtn) {
				return {
					v: false
				};
			}

			var topBtn = document.querySelector('button[data-action="show-widget-top"]');

			widgetSearchBtn.onclick = function () {
				widgetSearch.classList.add('opened-search');
				if (topBtn) {
					topBtn.classList.add('hide');
				}
			};

			widgetSearch.onmouseleave = function () {
				widgetSearch.classList.remove('opened-search');
				if (topBtn) {
					topBtn.classList.remove('hide');
				}
			};

			// navigationBlock.addEventListener('touchstart', ( event ) => {
			// 	event.stopPropagation();
			// 	widgetSearch.classList.remove('opened-search');
			// 	if( topBtn ) {
			// 		topBtn.classList.remove('hide');
			// 	}
			// });

			if (widgetBlockTop) {
				widgetBlockTop.addEventListener('touchstart', function (event) {
					event.stopPropagation();

					var target = event.target;
					if (target.classList.contains('widget-search-overlay')) {
						return false;
					}
					if (target.classList.contains('widget-search')) {
						return false;
					}
					if (target.classList.contains('widget-search-content')) {
						return false;
					}
					if (target.tagName === "INPUT") {
						return false;
					}

					widgetSearch.classList.remove('opened-search');
					if (topBtn) {
						topBtn.classList.remove('hide');
					}
					if (widgetLang) {
						widgetLang.classList.remove('opened-lang');
					}
				});
			}
		})();

		if (typeof _ret3 === 'object') return _ret3.v;
	}
}

/* Show message */
function showMessage(target) {

	if (!target) {
		return false;
	}

	var message = document.querySelector('#message');
	if (!message) {
		return false;
	}
	var currentPage = pages.contentPage[pages.currentPage];

	if (!currentPage) {
		return false;
	}

	currentPage.classList.remove('current-page');
	message.classList.add('current-page');

	target.setAttribute('data-action', 'close-message');
}

/* Close message */
function closeMessage(target) {
	if (!target) {
		return false;
	}

	var message = document.querySelector('#message');
	if (!message) {
		return false;
	}
	var currentPage = pages.contentPage[pages.currentPage];

	if (!currentPage) {
		return false;
	}

	currentPage.classList.add('current-page');
	message.classList.remove('current-page');

	target.setAttribute('data-action', 'show-message');
}

function iframeSize() {
	var iframes = document.querySelectorAll('.responsive-iframe'),
	    length = iframes.length;
	if (length <= 0) {
		return false;
	}
	arrProto.forEach.call(iframes, function (iframe) {
		var width = iframe.getAttribute('width');
		var height = iframe.getAttribute('height');
		if (!width || !height) {
			return false;
		}
		var ratio = height / width;
		var frameWidth = iframe.clientWidth * ratio;
		iframe.width = iframe.clientWidth;
		iframe.height = frameWidth;
	});
}

/* Sing In */
function openSignIn(target) {
	if (!target) {
		return false;
	}
	var signIn = document.getElementById('sign-in-page');

	if (!signIn) {
		return false;
	}

	var navigation = document.querySelector('.navigation');
	if (navigation) {
		navigation.classList.remove('enable-hover');
	}

	var btn = document.querySelector('.navigation-btn');
	if (btn) {
		btn.setAttribute('data-action', 'close-sign-in');
	}

	pages.contentPage[pages.currentPage].classList.remove('current-page');
	setTimeout(function () {
		signIn.classList.add('current-page');
	}, 400);
}

function closeSignIn(target) {
	var action = 'show-menu';
	if (window.innerWidth >= 992) {
		action = 'go-next-page';
	}
	if (target) {
		target.setAttribute('data-action', action);
	} else {
		var btn = document.querySelector('.navigation-btn');
		if (btn) {
			btn.setAttribute('data-action', action);
		}
	}

	var navigation = document.querySelector('.navigation');
	if (navigation) {
		navigation.classList.add('enable-hover');
	}

	var signIn = document.getElementById('sign-in-page');

	if (!signIn) {
		return false;
	}

	signIn.classList.remove('current-page');
	setTimeout(function () {
		pages.contentPage[pages.currentPage].classList.add('current-page');
	}, 400);
}

/**
 * Social Likes
 * http://sapegin.github.com/social-likes
 *
 * Sharing buttons for Russian and worldwide social networks.
 *
 * @requires jQuery
 * @author Artem Sapegin
 * @copyright 2014 Artem Sapegin (sapegin.me)
 * @license MIT
 */

/*global define:false, socialLikesButtons:false */

/**
 * fix Twitter counter
 * Create account at OpenShareCount. http://opensharecount.com/
 * Add this script before you include social-likes.js:
 */
var socialLikesButtons = {
	twitter: {
		counterUrl: 'https://opensharecount.com/count.json?url={url}&callback=?',
		convertNumber: function convertNumber(data) {
			return data.count;
		}
	}
};

(function (factory) {
	// Try to register as an anonymous AMD module
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else {
		factory(jQuery);
	}
})(function ($, undefined) {

	'use strict';

	var prefix = 'social-likes';
	var classPrefix = prefix + '__';
	var openClass = prefix + '_opened';
	var protocol = location.protocol === 'https:' ? 'https:' : 'http:';
	var isHttps = protocol === 'https:';

	/**
  * Buttons
  */
	var services = {
		facebook: {
			// https://developers.facebook.com/docs/reference/fql/link_stat/
			counterUrl: 'https://graph.facebook.com/fql?q=SELECT+total_count+FROM+link_stat+WHERE+url%3D%22{url}%22&callback=?',
			convertNumber: function convertNumber(data) {
				return data.data[0].total_count;
			},
			popupUrl: 'https://www.facebook.com/sharer/sharer.php?u={url}',
			popupWidth: 600,
			popupHeight: 359
		},
		twitter: {
			popupUrl: 'https://twitter.com/intent/tweet?url={url}&text={title}',
			popupWidth: 600,
			popupHeight: 250,
			click: function click() {
				// Add colon to improve readability
				if (!/[\.\?:\-–—]\s*$/.test(this.options.title)) this.options.title += ':';
				return true;
			}
		},
		mailru: {
			counterUrl: protocol + '//connect.mail.ru/share_count?url_list={url}&callback=1&func=?',
			convertNumber: function convertNumber(data) {
				for (var url in data) {
					if (data.hasOwnProperty(url)) {
						return data[url].shares;
					}
				}
			},
			popupUrl: 'https://connect.mail.ru/share?share_url={url}&title={title}',
			popupWidth: 492,
			popupHeight: 500
		},
		vkontakte: {
			counterUrl: 'https://vk.com/share.php?act=count&url={url}&index={index}',
			counter: function counter(jsonUrl, deferred) {
				var options = services.vkontakte;
				if (!options._) {
					options._ = [];
					if (!window.VK) window.VK = {};
					window.VK.Share = {
						count: function count(idx, number) {
							options._[idx].resolve(number);
						}
					};
				}

				var index = options._.length;
				options._.push(deferred);
				$.getScript(makeUrl(jsonUrl, { index: index })).fail(deferred.reject);
			},
			popupUrl: 'https://vk.com/share.php?url={url}&title={title}',
			popupWidth: 655,
			popupHeight: 450
		},
		odnoklassniki: {
			counterUrl: protocol + '//connect.ok.ru/dk?st.cmd=extLike&ref={url}&uid={index}',
			counter: function counter(jsonUrl, deferred) {
				var options = services.odnoklassniki;
				if (!options._) {
					options._ = [];
					if (!window.ODKL) window.ODKL = {};
					window.ODKL.updateCount = function (idx, number) {
						options._[idx].resolve(number);
					};
				}

				var index = options._.length;
				options._.push(deferred);
				$.getScript(makeUrl(jsonUrl, { index: index })).fail(deferred.reject);
			},
			popupUrl: 'https://connect.ok.ru/dk?st.cmd=WidgetSharePreview&service=odnoklassniki&st.shareUrl={url}',
			popupWidth: 580,
			popupHeight: 336
		},
		plusone: {
			counterUrl: protocol + '//share.yandex.ru/gpp.xml?url={url}&callback=?',
			convertNumber: function convertNumber(number) {
				return parseInt(number.replace(/\D/g, ''), 10);
			},
			popupUrl: 'https://plus.google.com/share?url={url}',
			popupWidth: 500,
			popupHeight: 550
		},
		pinterest: {
			counterUrl: protocol + '//api.pinterest.com/v1/urls/count.json?url={url}&callback=?',
			convertNumber: function convertNumber(data) {
				return data.count;
			},
			popupUrl: 'https://pinterest.com/pin/create/button/?url={url}&description={title}',
			popupWidth: 740,
			popupHeight: 550
		}
	};

	/**
  * Counters manager
  */
	var counters = {
		promises: {},
		fetch: function fetch(service, url, extraOptions) {
			if (!counters.promises[service]) counters.promises[service] = {};
			var servicePromises = counters.promises[service];

			if (!extraOptions.forceUpdate && servicePromises[url]) {
				return servicePromises[url];
			} else {
				var options = $.extend({}, services[service], extraOptions);
				var deferred = $.Deferred();
				var jsonUrl = options.counterUrl && makeUrl(options.counterUrl, { url: url });

				if (jsonUrl && $.isFunction(options.counter)) {
					options.counter(jsonUrl, deferred);
				} else if (options.counterUrl) {
					$.getJSON(jsonUrl).done(function (data) {
						try {
							var number = data;
							if ($.isFunction(options.convertNumber)) {
								number = options.convertNumber(data);
							}
							deferred.resolve(number);
						} catch (e) {
							deferred.reject();
						}
					}).fail(deferred.reject);
				} else {
					deferred.reject();
				}

				servicePromises[url] = deferred.promise();
				return servicePromises[url];
			}
		}
	};

	/**
  * jQuery plugin
  */
	$.fn.socialLikes = function (options) {
		return this.each(function () {
			var elem = $(this);
			var instance = elem.data(prefix);
			if (instance) {
				if ($.isPlainObject(options)) {
					instance.update(options);
				}
			} else {
				instance = new SocialLikes(elem, $.extend({}, $.fn.socialLikes.defaults, options, dataToOptions(elem)));
				elem.data(prefix, instance);
			}
		});
	};

	$.fn.socialLikes.defaults = {
		// change url
		// url: window.location.href.replace(window.location.hash, ''),
		url: window.location.href,
		title: document.title,
		counters: true,
		zeroes: false,
		wait: 500, // Show buttons only after counters are ready or after this amount of time
		timeout: 10000, // Show counters after this amount of time even if they aren’t ready
		popupCheckInterval: 500,
		singleTitle: 'Share'
	};

	function SocialLikes(container, options) {
		this.container = container;
		this.options = options;
		this.init();
	}

	SocialLikes.prototype = {
		init: function init() {
			// Add class in case of manual initialization
			this.container.addClass(prefix);

			this.single = this.container.hasClass(prefix + '_single');

			this.initUserButtons();

			this.countersLeft = 0;
			this.number = 0;
			this.container.on('counter.' + prefix, $.proxy(this.updateCounter, this));

			var buttons = this.container.children();

			this.makeSingleButton();

			this.buttons = [];
			buttons.each($.proxy(function (idx, elem) {
				var button = new Button($(elem), this.options);
				this.buttons.push(button);
				if (button.options.counterUrl) this.countersLeft++;
			}, this));

			if (this.options.counters) {
				this.timer = setTimeout($.proxy(this.appear, this), this.options.wait);
				this.timeout = setTimeout($.proxy(this.ready, this, true), this.options.timeout);
			} else {
				this.appear();
			}
		},
		initUserButtons: function initUserButtons() {
			if (!this.userButtonInited && window.socialLikesButtons) {
				$.extend(true, services, socialLikesButtons);
			}
			this.userButtonInited = true;
		},
		makeSingleButton: function makeSingleButton() {
			if (!this.single) return;

			var container = this.container;
			container.addClass(prefix + '_vertical');
			container.wrap($('<div>', { 'class': prefix + '_single-w' }));
			container.wrapInner($('<div>', { 'class': prefix + '__single-container' }));
			var wrapper = container.parent();

			// Widget
			var widget = $('<div>', {
				'class': _getElementClassNames('widget', 'single')
			});
			var button = $(template('<div class="{buttonCls}">' + '<span class="{iconCls}"></span>' + '{title}' + '</div>', {
				buttonCls: _getElementClassNames('button', 'single'),
				iconCls: _getElementClassNames('icon', 'single'),
				title: this.options.singleTitle
			}));
			widget.append(button);
			wrapper.append(widget);

			widget.on('click', function () {
				var activeClass = prefix + '__widget_active';
				widget.toggleClass(activeClass);
				if (widget.hasClass(activeClass)) {
					container.css({ left: -(container.width() - widget.width()) / 2, top: -container.height() });
					showInViewport(container);
					closeOnClick(container, function () {
						widget.removeClass(activeClass);
					});
				} else {
					container.removeClass(openClass);
				}
				return false;
			});

			this.widget = widget;
		},
		update: function update(options) {
			if (!options.forceUpdate && options.url === this.options.url) return;

			// Reset counters
			this.number = 0;
			this.countersLeft = this.buttons.length;
			if (this.widget) this.widget.find('.' + prefix + '__counter').remove();

			// Update options
			$.extend(this.options, options);
			for (var buttonIdx = 0; buttonIdx < this.buttons.length; buttonIdx++) {
				this.buttons[buttonIdx].update(options);
			}
		},
		updateCounter: function updateCounter(e, service, number) {
			number = number || 0;

			if (number || this.options.zeroes) {
				this.number += number;
				if (this.single) {
					this.getCounterElem().text(this.number);
				}
			}

			if (this.countersLeft === 0) {
				this.appear();
				this.ready();
			}
			this.countersLeft--;
		},
		appear: function appear() {
			this.container.addClass(prefix + '_visible');
		},
		ready: function ready(silent) {
			if (this.timeout) {
				clearTimeout(this.timeout);
			}
			this.container.addClass(prefix + '_ready');
			if (!silent) {
				this.container.trigger('ready.' + prefix, this.number);
			}
		},
		getCounterElem: function getCounterElem() {
			var counterElem = this.widget.find('.' + classPrefix + 'counter_single');
			if (!counterElem.length) {
				counterElem = $('<span>', {
					'class': _getElementClassNames('counter', 'single')
				});
				this.widget.append(counterElem);
			}
			return counterElem;
		}
	};

	function Button(widget, options) {
		this.widget = widget;
		this.options = $.extend({}, options);
		this.detectService();
		if (this.service) {
			this.init();
		}
	}

	Button.prototype = {
		init: function init() {
			this.detectParams();
			this.initHtml();
			setTimeout($.proxy(this.initCounter, this), 0);
		},

		update: function update(options) {
			$.extend(this.options, { forceUpdate: false }, options);
			this.widget.find('.' + prefix + '__counter').remove(); // Remove old counter
			this.initCounter();
		},

		detectService: function detectService() {
			var service = this.widget.data('service');
			if (!service) {
				// class="facebook"
				var node = this.widget[0];
				var classes = node.classList || node.className.split(' ');
				for (var classIdx = 0; classIdx < classes.length; classIdx++) {
					var cls = classes[classIdx];
					if (services[cls]) {
						service = cls;
						break;
					}
				}
				if (!service) return;
			}
			this.service = service;
			$.extend(this.options, services[service]);
		},

		detectParams: function detectParams() {
			var data = this.widget.data();

			// Custom page counter URL or number
			if (data.counter) {
				var number = parseInt(data.counter, 10);
				if (isNaN(number)) {
					this.options.counterUrl = data.counter;
				} else {
					this.options.counterNumber = number;
				}
			}

			// Custom page title
			if (data.title) {
				this.options.title = data.title;
			}

			// Custom page URL
			if (data.url) {
				this.options.url = data.url;
			}
		},

		initHtml: function initHtml() {
			var options = this.options;
			var widget = this.widget;

			// Old initialization HTML
			var a = widget.find('a');
			if (a.length) {
				this.cloneDataAttrs(a, widget);
			}

			// Button
			var button = $('<span>', {
				'class': this.getElementClassNames('button'),
				'text': widget.text()
			});
			if (options.clickUrl) {
				var url = makeUrl(options.clickUrl, {
					url: options.url,
					title: options.title
				});
				var link = $('<a>', {
					href: url
				});
				this.cloneDataAttrs(widget, link);
				widget.replaceWith(link);
				this.widget = widget = link;
			} else {
				widget.on('click', $.proxy(this.click, this));
			}

			widget.removeClass(this.service);
			widget.addClass(this.getElementClassNames('widget'));

			// Icon
			button.prepend($('<span>', { 'class': this.getElementClassNames('icon') }));

			widget.empty().append(button);
			this.button = button;
		},

		initCounter: function initCounter() {
			if (this.options.counters) {
				if (this.options.counterNumber) {
					this.updateCounter(this.options.counterNumber);
				} else {
					var extraOptions = {
						counterUrl: this.options.counterUrl,
						forceUpdate: this.options.forceUpdate
					};
					counters.fetch(this.service, this.options.url, extraOptions).always($.proxy(this.updateCounter, this));
				}
			}
		},

		cloneDataAttrs: function cloneDataAttrs(source, destination) {
			var data = source.data();
			for (var key in data) {
				if (data.hasOwnProperty(key)) {
					destination.data(key, data[key]);
				}
			}
		},

		getElementClassNames: function getElementClassNames(elem) {
			return _getElementClassNames(elem, this.service);
		},

		updateCounter: function updateCounter(number) {
			number = parseInt(number, 10) || 0;

			var params = {
				'class': this.getElementClassNames('counter'),
				'text': number
			};
			if (!number && !this.options.zeroes) {
				params['class'] += ' ' + prefix + '__counter_empty';
				params.text = '';
			}
			var counterElem = $('<span>', params);
			this.widget.append(counterElem);

			this.widget.trigger('counter.' + prefix, [this.service, number]);
		},

		click: function click(e) {
			var options = this.options;
			var process = true;
			if ($.isFunction(options.click)) {
				process = options.click.call(this, e);
			}
			if (process) {
				var url = makeUrl(options.popupUrl, {
					url: options.url,
					title: options.title
				});
				url = this.addAdditionalParamsToUrl(url);
				this.openPopup(url, {
					width: options.popupWidth,
					height: options.popupHeight
				});
			}
			return false;
		},

		addAdditionalParamsToUrl: function addAdditionalParamsToUrl(url) {
			var params = $.param($.extend(this.widget.data(), this.options.data));
			if ($.isEmptyObject(params)) return url;
			var glue = url.indexOf('?') === -1 ? '?' : '&';
			return url + glue + params;
		},

		openPopup: function openPopup(url, params) {
			var left = Math.round(screen.width / 2 - params.width / 2);
			var top = 0;
			if (screen.height > params.height) {
				top = Math.round(screen.height / 3 - params.height / 2);
			}

			var win = window.open(url, 'sl_' + this.service, 'left=' + left + ',top=' + top + ',' + 'width=' + params.width + ',height=' + params.height + ',personalbar=0,toolbar=0,scrollbars=1,resizable=1');
			if (win) {
				win.focus();
				this.widget.trigger('popup_opened.' + prefix, [this.service, win]);
				var timer = setInterval($.proxy(function () {
					if (!win.closed) return;
					clearInterval(timer);
					this.widget.trigger('popup_closed.' + prefix, this.service);
				}, this), this.options.popupCheckInterval);
			} else {
				location.href = url;
			}
		}
	};

	/**
  * Helpers
  */

	// Camelize data-attributes
	function dataToOptions(elem) {
		function upper(m, l) {
			return l.toUpper();
		}
		var options = {};
		var data = elem.data();
		for (var key in data) {
			var value = data[key];
			if (value === 'yes') value = true;else if (value === 'no') value = false;
			options[key.replace(/-(\w)/g, upper)] = value;
		}
		return options;
	}

	function makeUrl(url, context) {
		return template(url, context, encodeURIComponent);
	}

	function template(tmpl, context, filter) {
		return tmpl.replace(/\{([^\}]+)\}/g, function (m, key) {
			// If key doesn't exists in the context we should keep template tag as is
			return key in context ? filter ? filter(context[key]) : context[key] : m;
		});
	}

	function _getElementClassNames(elem, mod) {
		var cls = classPrefix + elem;
		return cls + ' ' + cls + '_' + mod;
	}

	function closeOnClick(elem, callback) {
		function handler(e) {
			if (e.type === 'keydown' && e.which !== 27 || $(e.target).closest(elem).length) return;
			elem.removeClass(openClass);
			doc.off(events, handler);
			if ($.isFunction(callback)) callback();
		}
		var doc = $(document);
		var events = 'click touchstart keydown';
		doc.on(events, handler);
	}

	function showInViewport(elem) {
		var offset = 10;
		if (document.documentElement.getBoundingClientRect) {
			var left = parseInt(elem.css('left'), 10);
			var top = parseInt(elem.css('top'), 10);

			var rect = elem[0].getBoundingClientRect();
			if (rect.left < offset) elem.css('left', offset - rect.left + left);else if (rect.right > window.innerWidth - offset) elem.css('left', window.innerWidth - rect.right - offset + left);

			if (rect.top < offset) elem.css('top', offset - rect.top + top);else if (rect.bottom > window.innerHeight - offset) elem.css('top', window.innerHeight - rect.bottom - offset + top);
		}
		elem.addClass(openClass);
	}

	/**
  * Auto initialization
  */
	$(function () {
		$('.' + prefix).socialLikes();
	});

	return $.fn.socialLikes;
});