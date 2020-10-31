/* IntoGallery
** gallery in the intro page
----------------------------------------------------------------------*/

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var arrProto = Array.prototype;

var IntoGallery = (function () {
	function IntoGallery() {
		var _this = this;

		var block = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
		var itemClass = arguments.length <= 1 || arguments[1] === undefined ? '.item' : arguments[1];

		_classCallCheck(this, IntoGallery);

		// check ig block exist
		if (!block) {
			console.error('No such Node!');
			return false;
		}

		// get all element from the block
		var items = window.intoGalleryItems = this.items = block.querySelectorAll(itemClass),
		    // items length
		itemsLength = this.itemsLength = items.length;

		if (itemsLength <= 0) {
			console.error('There are no elements with class ' + itemClass + ' in block!');
			return false;
		}

		// all backgrounds
		this.itemBg = [];

		// background active
		this.itemBgActive = [];

		var speed = 200,
		    // speed change 600
		delay = 4800,
		    itemSpeed = 600 + Math.floor(itemsLength / 2 - 1) * speed;

		var secondDelay = (delay - itemSpeed * 2) / 2;

		arrProto.forEach.call(items, function (item, index) {
			_this.itemBg[index] = [];
			var bgs = item.querySelectorAll('.item-bg'),
			    bgsLength = bgs.length;

			// backgrounds
			if (bgsLength > 0) {
				var j = bgsLength;
				for (; j--;) {
					var bg = bgs[j];
					var color = bg.getAttribute('data-color');
					if (color) {
						bg.style.backgroundColor = color;
					}

					var bgImg = bg.getAttribute('data-src');
					if (bgImg) {
						bg.style.backgroundImage = 'url(' + bgImg + ')';
					}

					if (j === 0) {
						bg.classList.add('active');
						_this.itemBgActive[index] = j;
					}

					_this.itemBg[index].unshift(bg);
				}

				if (index % 2 === 0) {
					setInterval(function () {
						setTimeout(function () {
							_this.changeBg(index);
						}, index / 2 * speed);
					}, delay);
				}
			}
		});

		var secondInterval = function secondInterval(z) {

			setInterval(function () {
				setTimeout(function () {
					_this.changeBg(z);
				}, Math.floor(z / 2) * speed);
			}, delay);
		};

		setTimeout(function () {
			for (var i = 1; i < itemsLength; i = i + 2) {
				var z = i;

				secondInterval(z);
			}
		}, secondDelay + itemSpeed);
	}

	_createClass(IntoGallery, [{
		key: 'init',
		value: function init() {}

		/**
   * [changeBg change background in into cospo gallery]
   *
   * @param  {int} i [ position in array ]
   * @return {boolean}
   */
	}, {
		key: 'changeBg',
		value: function changeBg(i) {

			var active = this.itemBgActive[i];
			active = active + 1;
			if (!this.itemBg[i][active]) {
				active = 0;
				if (active === this.itemBgActive[i]) {
					return false;
				}
			}

			this.itemBg[i][active].classList.add('active');
			this.itemBg[i][this.itemBgActive[i]].classList.remove('active');

			this.itemBgActive[i] = active;

			return true;
		}
	}]);

	return IntoGallery;
})();

document.addEventListener('DOMContentLoaded', function () {
	'use strict';

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

	var block = document.querySelector('.into-cospo-gallery');
	var intoGalleryItems = null;
	var intoGallery = new IntoGallery(block);
	var clearTime = undefined;

	var btn = document.querySelector('.into-page-button');
	if (btn) {
		btn.onclick = function (event) {
			event = event || window.event;
			event.preventDefault();
			hideBlockTop();
		};
	}

	/* touch event on into-page */
	intoPageTouch();

	var elem = document;
	if (elem.addEventListener) {
		if ('onwheel' in document) {
			// IE9+, FF17+, Ch31+
			elem.addEventListener('wheel', setBlockTop);
		} else if ('onmousewheel' in document) {
			// устаревший вариант события
			elem.addEventListener('mousewheel', setBlockTop);
		} else {
			// Firefox < 17
			elem.addEventListener('MozMousePixelScroll', setBlockTop);
		}
	} else {
		// IE8-
		elem.attachEvent('onmousewheel', setBlockTop);
	}
});

function setBlockTop(e) {
	'use strict';

	var _this2 = this;

	if (!e) {
		return false;
	}

	e = e || window.event;

	// wheelDelta не дает возможность узнать количество пикселей
	var delta = e.deltaY || e.detail || e.wheelDelta;

	if (delta > 0) {
		delta = 100;
	} else if (delta < 0) {
		delta = -100;
	}

	if (/rv:11.0/i.test(navigator.userAgent) || /MSIE 9/i.test(navigator.userAgent) || /MSIE 10/i.test(navigator.userAgent)) {
		delta = -delta;
	}

	var intoGalleryItems = undefined;
	if (window.intoGalleryItems) {
		intoGalleryItems = window.intoGalleryItems;
	}

	if (!this.main) {
		this.main = document.querySelector('main');
	}

	if (!this.intoPage) {
		this.intoPage = document.querySelector('.into-page');
	}

	if (!this.intoPageContent) {
		this.intoPageContent = document.querySelector('.into-page-content');
	}

	var main = this.main,
	    intoPage = this.intoPage,
	    intoPageContent = this.intoPageContent;

	if (main.scrollTop === 0) {

		if (delta < 0) {
			return false;
			intoPageContent.classList.remove('into-page-content--hide');

			if (window.intoGalleryItems) {
				var l = window.intoGalleryItems.length;
				var items = window.intoGalleryItems;
				for (var j = 0; j < l; j++) {
					items[j].classList.remove('item--hide');
				}
			}

			intoPage.style.zIndex = '';
		} else if (delta > 0) {

			if (!intoPageContent.classList.contains('into-page-content--hide')) {
				intoPageContent.classList.add('into-page-content--hide');

				if (window.intoGalleryItems) {
					var l = window.intoGalleryItems.length;
					var items = window.intoGalleryItems;
					for (var j = 0; j < l; j++) {
						items[j].classList.add('item--hide');
					}
				}

				this.isAnimation = true;
				clearTimeout(this.clearTime);
				this.clearTime = setTimeout(function () {
					_this2.isAnimation = false;
					if (intoPageContent.classList.contains('into-page-content--hide')) {
						intoPage.style.zIndex = -1;
					}
				}, 1200);
			}

			if (this.isAnimation) {
				e.preventDefault ? e.preventDefault() : e.returnValue = false;
			}
		}
	}
}

function hideBlockTop() {
	'use strict';

	var intoPage = document.querySelector('.into-page'),
	    intoPageContent = document.querySelector('.into-page-content');

	intoPageContent.classList.add('into-page-content--hide');

	if (window.intoGalleryItems) {
		var l = window.intoGalleryItems.length;
		var items = window.intoGalleryItems;
		for (var j = 0; j < l; j++) {
			items[j].classList.add('item--hide');
		}
	}

	setTimeout(function () {
		if (intoPageContent.classList.contains('into-page-content--hide')) {
			intoPage.style.zIndex = -1;
		}
	}, 1200);
}

function intoPageTouch() {

	var intoPage = document.querySelector('.into-page'),
	    start = undefined,
	    end = undefined;

	var endTouch = function endTouch(event) {
		if (start > end) {
			hideBlockTop();
		}
	};

	var moveTouch = function moveTouch(event) {
		event.stopPropagation();
		event.preventDefault();
		end = event.targetTouches[0].pageY;
	};

	var startTouch = function startTouch(event) {
		start = event.targetTouches[0].pageY;
	};

	intoPage.addEventListener('touchstart', startTouch);
	intoPage.addEventListener('touchmove', moveTouch);
	intoPage.addEventListener('touchend', endTouch);
}