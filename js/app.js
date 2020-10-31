/**
 * App
 */
/* optimizaton [].forEach.call */
/* need use arrProto instead [] */
'use strict';

var arrProto = Array.prototype;

// WINDOW LOAD
window.onload = function () {
	"use strict";

	// galleryBigItem();
	var videoBg = document.querySelectorAll('.bg-video');
	disableVideoSound(videoBg);

	try {
		/**
   * Init Scroll
   */
		scroll.init();
	} catch (e) {
		console.error('Scroll problem: ' + e);
	}

	// delete main-preloader
	var mainPreloader = document.querySelector('.main-preloader');
	if (mainPreloader) {
		mainPreloader.classList.add('window-is-loaded');
		setTimeout(function () {
			mainPreloader.parentNode.removeChild(mainPreloader);
		}, 650);
	}
	// /delete main-preloader
};

var tmpTime = undefined;

window.addEventListener('resize', function () {
	"use strict";

	// pages.goToHash();

	var w = window.innerWidth;

	if (window.showMenuBtn && w >= 768) {
		showMenuBtn.classList.remove('hideMenu');
	}

	var videoBg = document.querySelectorAll('.bg-video');
	disableVideoSound(videoBg);

	if (w >= 992) {
		var nav = document.querySelector('.navigation');
		if (!nav) {
			return;
		}

		if (nav.classList.contains('open')) {
			nav.classList.remove('open');
		}
	}

	clearTimeout(tmpTime);
	tmpTime = setTimeout(function () {
		centerImage({
			block: document.body,
			nameClass: '.body-bg'
		});

		centerImage({
			block: document.body,
			nameClass: '.blog-post-bg'
		});
	}, 300);

	setTimeout(function () {
		iframeSize();
		/* login page check if exist */
		var signInPage = document.querySelector('.sign-in-page');
		if (signInPage && signInPage.classList.contains('current-page')) {
			pages.contentPage[pages.currentPage].classList.remove('current-page');
			var navBtn = document.querySelector('.navigation-btn');
			if (navBtn) {
				navBtn.setAttribute('data-action', 'close-sign-in');
			}
		}
	}, 500);
});

/***************************** CONTROLLER ****************************************/

// DOCUMENT EVENTS
document.addEventListener('click', function (event) {

	"use strict";

	var target = event.target,
	    index;

	var action = target.getAttribute('data-action');

	var id = target.getAttribute('href');

	if (!id) {
		var tmpTarget = target;
		while (!id) {
			tmpTarget = tmpTarget.parentNode;
			// if( ! tmpTarget ) {
			// 	break;
			// }
			if (tmpTarget && tmpTarget.tagName === 'BODY') {
				break;
			}
			if (!tmpTarget) {
				break;
			} else {
				id = tmpTarget.getAttribute('href');
			}
		}
		if (id) {
			target = tmpTarget;
		}
	}

	if (!id && !action) {
		var tmpTarget = target;
		while (!action) {
			tmpTarget = tmpTarget.parentNode;
			if (tmpTarget && tmpTarget.tagName === 'BODY') {
				break;
			}
			if (!tmpTarget) {
				break;
			} else {
				action = tmpTarget.getAttribute('data-action');
			}
		}
		if (action) {
			target = tmpTarget;
		}
	}

	/**
  * Detect click on link with hash
  * Find page with hash id
  * Open Page
  */
	if (target.tagName === 'A') {

		var hash = target.getAttribute('href');
		if (hash) {
			hash = hash[0] === '#' ? 1 : -1;
		} else {
			hash = -1;
		}

		if (hash !== -1) {

			event.preventDefault();

			id = target.getAttribute('href');

			if (id === '#') {
				var dataAction = target.getAttribute('data-action');
				if (!dataAction) {
					SubMenu.showSubMenu(target);
				} else if (dataAction === 'close-sub-menu') {
					SubMenu.closeSubMenu();
				}
				return true;
			}

			id = id.replace('#', '');

			action = id.match(/\/\S+/ig);

			id = id.replace(action, '');

			index = pages.idArray.indexOf(id);

			if (index !== -1) {

				if (pages.currentPage !== index) {

					pages.closeAjaxPage();

					if (window.gallery) {
						gallery.deleteCloseBtn();
					}

					if (action) {
						location.hash = id + action;
						if (window.gallery) {
							gallery.onFirstLoad();
						}
					} else {
						if (!target.getAttribute('data-action')) {
							pages.hashAction = '';
						}

						var _parent = target.parentNode;
						while (!_parent.classList.contains('navigation-menu')) {
							_parent = _parent.parentNode;

							if (_parent.tagName === "BODY") {
								_parent = false;
								break;
							}
						}

						if (window.innerWidth >= 992) {
							if (!_parent) {
								navCarousel.goTo(index + navCarousel.liLength - Math.floor(navCarousel.countVisibleItem / 2));
							} else {
								navCarousel.setCurrentPosition(index, target.parentNode, id);
								navCarousel.openFullMenu();
							}
							pages.goTo(index);
						} else if (window.innerWidth < 992) {
							// pages.animateScrollTop( index, 0 );
							// if( target.parentNode.classList.contains('main-active') ) {
							pages.goTo(index, 20);
							// }
						}
					}
				}

				// if ( window.innerWidth < 768 ) {
				if (window.innerWidth < 992) {
					setTimeout(function () {
						navigation.hideMobile();
					}, 100);
				}
			}

			return true;
		}
	}

	if (action && action.indexOf('#') !== -1) {

		action = action.replace('#', '');

		index = pages.idArray.indexOf(action);

		if (index !== -1) {

			if (pages.currentPage !== index) {

				pages.closeAjaxPage();

				if (window.gallery) {
					gallery.deleteCloseBtn();
				}

				navCarousel.goTo(index + navCarousel.liLength - Math.floor(navCarousel.countVisibleItem / 2));
				pages.goTo(index);

				if (window.innerWidth < 992) {
					pages.animateScrollTop(index);
				}
			}
		}

		if (window.innerWidth < 768) {
			navigation.hideMobile();
		}
	}

	switch (action) {
		case 'close-ajax-page':
			if (window.gallery) {
				gallery.deletePage(target);
				pages.closeAjaxPage();
			}
			break;
		case 'go-next-page':
			navCarousel.goNext();
			// if ( window.pages ) {
			// pages.closeAjaxPage();
			// pages.nextPage();
			// }
			event.preventDefault();
			break;
		case 'go-prev-page':
			navCarousel.goNext();
			// if ( window.pages ) {
			// 	pages.closeAjaxPage();
			// 	pages.prevPage();
			// }
			event.preventDefault();
			break;
		case 'show-menu':
			navigation.showMobile();
			break;
		case 'close-menu':
			navigation.hideMobile();
			break;
		case 'show-map':
			googleMap.showMap(target);
			break;
		case 'hide-map':
			googleMap.hideMap();
			break;
		case 'show-video':
			video.showVideo(target);
			break;
		// case 'show-sub-menu':
		// 	SubMenu.showSubMenu( target );
		// 	break;
		// case 'close-sub-menu':
		// 	SubMenu.closeSubMenu();
		// 	break;
		case 'show-full':
			ShowFullImage.init(target);
			break;

		case 'show-post':
			target.classList.add('loading');
			gallery.createBlogPage();
			var src = target.getAttribute('data-src');
			if (src) {
				gallery.sendRequest(src, 'blog-post', target);
			}
			break;

		case 'show-message':
			showMessage(target);
			break;

		case 'close-message':
			closeMessage(target);
			break;

		case 'sign-in':
			openSignIn(target);
			break;

		case 'close-sign-in':
			closeSignIn(target);
			break;
	}
});

document.addEventListener('keydown', function (event) {
	"use strict";

	if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
		return false;
	}

	switch (event.keyCode) {
		case 39:
			navCarousel.goNext(true);
			// pages.nextPage();
			// pages.closeAjaxPage();
			break;
		case 37:
			navCarousel.goPrev(true);
			// pages.prevPage();
			// pages.closeAjaxPage();
			break;
	}
});

// hide/show mobile menu when scroll
var lastScrollTop,
    showMenuBtn = document.querySelector('.navigation-btn');

if (showMenuBtn) {
	if (window.innerWidth < 992) {
		showMenuBtn.setAttribute('data-action', 'show-menu');
	} else {
		showMenuBtn.setAttribute('data-action', 'go-next-page');
	}
}

document.body.addEventListener('scroll', function (event) {
	"use strict";
	event.preventDefault();
});
document.addEventListener('scroll', function (event) {
	"use strict";
	event.preventDefault();
});
//
document.addEventListener('touchmove', function (event) {
	"use strict";
	var target = event.target;
	while (!target.classList.contains('navigation')) {
		target = target.parentNode;
		if (target.tagName === "BODY") {
			event.preventDefault();
			break;
		}
	}
});

/******************************************************************************************/

var pages, scroll, navigation, navCarousel;

var ajaxNav = [];
var gallery;
var googleMap;

var SubMenu;

var isOnpopstate = true;

document.addEventListener('DOMContentLoaded', function () {
	"use strict";

	if (isRetina) {
		Retina.init(root, isRetina);
	}

	// /**
	//  * Init Scroll
	//  * @type {Scroll}
	//  */
	scroll = new Scroll();

	/**
  * Init PageTranslate
  * @type {PageTranslate}
  */
	pages = new PageTranslate();

	// init Navigation
	navigation = new Navigation();

	navCarousel = new NavigationCarousel();
	navCarousel.carouselMenu();

	SubMenu = new SubULMenu();

	/**
  * Init Scroll
  */
	try {
		scroll.init();
	} catch (e) {
		console.error('Scroll problem: ' + e);
	}

	/**
  * APP
  */
	/**
  * Init mobile left menu
  */
	try {
		var ajaxMenu = document.querySelectorAll('.ajax-menu');
		var ajaxMenuLength = ajaxMenu.length;

		for (var i = 0; i < ajaxMenuLength; i++) {
			ajaxNav.push(new LeftMenu({
				gallery: ajaxMenu[i]
			}));
		}
	} catch (e) {
		console.error('Accordeon problem: ' + e);
	}

	/**
  * Init Gallery
  * @type {Gallery}
  */
	// try {
	gallery = new Gallery();
	// } catch ( e ) {
	// 	console.error( 'Gallery problem: ' + e );
	// }

	/**
 	 * Init accordeon
 	//  */
	try {
		var accordeon = new Accordeon({
			scroll: scroll
		});
	} catch (e) {
		console.error('Accordeon problem: ' + e);
	}

	/**
  * Google Map
  */
	try {
		var gMap = document.querySelector('.map');
		googleMap = new GoogleMap(gMap);
	} catch (e) {
		console.error(e);
	}

	centerImage({
		block: document.body,
		nameClass: '.body-bg'
	});

	centerImage({
		block: document.body,
		nameClass: '.blog-post-bg'
	});

	// main scroll
	mainScroll();

	// scale nav bg
	scaleMenuBlocks();

	// load all static ajax page
	loadAllStaticAjaxPage();

	// iframe width and height
	iframeSize();

	// onpopstate
	// popstatePage();
}, false);