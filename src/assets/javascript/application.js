(function (w) {
  "use strict";
  function appInit(trackingId) {
    var cookies = window.GOVSignIn.Cookies(trackingId);

    cookies.processCookieConsentFlag();

    if (cookies.hasConsentForAnalytics()) {
      cookies.initAnalytics();
    }

    if (cookies.isOnCookiesPage()) {
      cookies.cookiesPageInit();
    } else {
      cookies.cookieBannerInit();
    }
  }
  w.GOVSignIn.appInit = appInit;
})(window);
