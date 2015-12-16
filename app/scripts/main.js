/**
 * Created by ricardomendes on 15/12/15.
 */

jQuery(document).ready(function ($) {
    /**
     * Drag & drop
     */
    var drop = document.querySelector('#collection');

    function cancel(e) {
        if (e.preventDefault) e.preventDefault(); // required by FF + Safari
        e.dataTransfer.dropEffect = 'copy'; // tells the browser what drop effect is allowed here
        return false; // required by IE
    }

    // Tells the browser that we *can* drop on this target
    addEvent(drop, 'dragover', cancel);
    addEvent(drop, 'dragenter', cancel);
    addEvent(drop, 'drop', function (e) {
        if (e.preventDefault) e.preventDefault(); // stops the browser from redirecting off to the text.

        angular.element(document.getElementById('AppCtrl')).scope().callAddURL(e.dataTransfer.getData("text/uri-list"));
        return false;
    });
});

var addEvent = (function ($) {
    if (document.addEventListener) {
        return function (el, type, fn) {
            if (el && el.nodeName || el === window) {
                el.addEventListener(type, fn, false);
            } else if (el && el.length) {
                for (var i = 0; i < el.length; i++) {
                    addEvent(el[i], type, fn);
                }
            }
        };
    } else {
        return function (el, type, fn) {
            if (el && el.nodeName || el === window) {
                el.attachEvent('on' + type, function () {
                    return fn.call(el, window.event);
                });
            } else if (el && el.length) {
                for (var i = 0; i < el.length; i++) {
                    addEvent(el[i], type, fn);
                }
            }
        };
    }
})();