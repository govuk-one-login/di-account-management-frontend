window.DI = window.DI || {}
window.DI.Cookies = window.DI.Cookies || {};

(function (cookies) {
  "use strict";

  function setCookie(name, values, options) {
    if (typeof options === "undefined") {
      options = {};
    }

    var cookieString = name + "=" + JSON.stringify(values);
    if (options.days) {
      var date = new Date();
      date.setTime(date.getTime() + options.days * 24 * 60 * 60 * 1000);
      cookieString =
        cookieString +
        "; expires=" +
        date.toGMTString() +
        "; path=/;" +
        " domain=" +
        window.DI.Constants.analyticsCookieDomain +
        ";";
    }

    if (document.location.protocol === "https:") {
      cookieString = cookieString + "; Secure";
    }

    document.cookie = cookieString;
  }

  function getCookie(name) {
    var nameEQ = name + "=";
    var cookies = document.cookie.split(";");
    for (var i = 0, len = cookies.length; i < len; i++) {
      var cookie = cookies[i];
      while (cookie.charAt(0) === " ") {
        cookie = cookie.substring(1, cookie.length);
      }
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
    return null;
  }

  function hasConsentForAnalytics() {
    var cookieConsent = JSON.parse(window.DI.Cookies.getCookie("cookies_preferences_set"));
    return cookieConsent ? cookieConsent.analytics : false;
  }

  function cookieBannerInit() {
    var COOKIES_PREFERENCES_SET = "cookies_preferences_set";
    var cookiesAccepted = document.querySelector("#cookies-accepted");
    var cookiesRejected = document.querySelector("#cookies-rejected");
    var hideCookieBanner = document.querySelectorAll(".cookie-hide-button");
    var cookieBannerContainer = document.querySelector(".govuk-cookie-banner");
    var cookieBanner = document.querySelector("#cookies-banner-main");
    var acceptCookies = document.querySelector('button[name="cookiesAccept"]');
    var rejectCookies = document.querySelector('button[name="cookiesReject"]');

    acceptCookies.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        setBannerCookieConsent(true);
      }.bind(this)
    );

    rejectCookies.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        setBannerCookieConsent(false);
      }.bind(this)
    );

    var hideButtons = Array.prototype.slice.call(hideCookieBanner);
    hideButtons.forEach(function (element) {
      element.addEventListener(
        "click",
        function (event) {
          event.preventDefault();
          hideElement(cookieBannerContainer);
        }.bind(this)
      );
    });

    var hasCookiesPolicy = window.DI.Cookies.getCookie(COOKIES_PREFERENCES_SET);

    if (!hasCookiesPolicy) {
      showElement(cookieBannerContainer);
    }

    function setBannerCookieConsent(analyticsConsent) {
      window.DI.Cookies.setCookie(
        COOKIES_PREFERENCES_SET,
        { analytics: analyticsConsent },
        { days: 365 }
      );
  
      hideElement(cookieBanner);
  
      if (analyticsConsent) {
        showElement(cookiesAccepted);

      var event
      if (typeof window.CustomEvent === 'function') {
        event = new window.CustomEvent("cookie-consent")
      } else {
        event = document.createEvent('CustomEvent')
        event.initCustomEvent("cookie-consent")
      }
      window.dispatchEvent(event)
      } else {
        showElement(cookiesRejected);
      }
    }
  
    function hideElement(el) {
      el.style.display = "none";
    }
  
    function showElement(el) {
      el.style.display = "block";
    }
  }
  
  window.DI.Cookies.hasConsentForAnalytics = hasConsentForAnalytics;
  window.DI.Cookies.setCookie = setCookie;
  window.DI.Cookies.getCookie = getCookie;
  window.DI.Cookies.cookieBannerInit = cookieBannerInit;
})(window.DI.Cookies)

