(function (w) {
  "use strict";
  function appInit(trackingId) {
    var cookies = window.GOVSignIn.Cookies(trackingId);
    var navbar = window.GOVSignIn.Navbar();

    if (cookies.hasConsentForAnalytics()) {
      cookies.initAnalytics();
    }

    if (cookies.isOnCookiesPage()) {
      cookies.cookiesPageInit();
    } else {
      cookies.cookieBannerInit();
    }

    navbar.navbarInit();
  }
  w.GOVSignIn.appInit = appInit;
})(window);
