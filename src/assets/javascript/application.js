(function (w) {
  "use strict";
  function appInit(trackingId, analyticsCookieDomain) {
    window.GOVUKFrontend.initAll();
    
    var cookies = window.GOVSignIn.Cookies(trackingId, analyticsCookieDomain);

    if (cookies.hasConsentForAnalytics()) {
      cookies.initAnalytics();
    }

    cookies.cookieBannerInit();
  }

  if (w.GOVUK && w.GOVUK.Modules && w.GOVUK.Modules.ShowPassword) {
    var modules = document.querySelectorAll('[data-module="show-password"]');

    for (var i = 0, l = modules.length; i < l; i++) {
      if (GOVUK.Modules.ShowPassword.prototype.init) {
        new GOVUK.Modules.ShowPassword(modules[i]).init();
      }
    }
  }

  w.GOVSignIn.appInit = appInit;
})(window);
