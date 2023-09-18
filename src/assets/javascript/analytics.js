window.DI = window.DI || {}
window.DI.Analytics = window.DI.Analytics || {};

(function (analytics) {
  "use strict";
  
  function init() {
    if (window.DI.Cookies.hasConsentForAnalytics()) {
      // if the user has already consented to analytics, initialise UA and GA4
      var constants = window.DI.Constants || {};

      if (window.DI.Analytics.Ua) {
        window.DI.Analytics.Ua.init()
      }

      if (window.DI.Analytics.Ga4 && constants.ga4Enabled) {
        window.DI.Analytics.Ga4.init()
      }
    } else {
      // if the user has not already consented to analytics, listen for the cookie consent event
      window.addEventListener('cookie-consent', function() { return window.DI.Analytics.init()})
    }
  }

  function loadGtm(containerId) {
    const gtmScriptTag = document.createElement("script");
    gtmScriptTag.type = "text/javascript";
    gtmScriptTag.setAttribute("async", "true");
    gtmScriptTag.setAttribute(
      "src",
      "https://www.googletagmanager.com/gtm.js?id=" + containerId
    );
    gtmScriptTag.setAttribute("crossorigin", "anonymous");
    document.documentElement.firstChild.appendChild(gtmScriptTag);
  }

  function sendData(data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
  }

  window.DI.Analytics.init = init;
  window.DI.Analytics.sendData = sendData;
  window.DI.Analytics.loadGtm = loadGtm;
})(window.DI.Analytics);