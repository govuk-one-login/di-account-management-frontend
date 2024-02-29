(function (w) {
  "use strict";
  function appInit(params) {
    var constants = {};
    var cookies = w.DI.Cookies;

    constants.uaTrackingId = params.uaTrackingId;
    constants.analyticsCookieDomain = params.analyticsCookieDomain;
    constants.ga4TrackingId = params.ga4TrackingId;
    constants.ga4Enabled = params.ga4Enabled;

    w.DI.Constants = constants;
  
    w.GOVUKFrontend.initAll();

    cookies.cookieBannerInit();
    
    w.DI.Analytics.init();
  }

  if (w.DI && w.DI.Modules && w.DI.Modules.ShowPassword) {
    var modules = document.querySelectorAll('[data-module="show-password"]');

    for (var i = 0, l = modules.length; i < l; i++) {
      if (DI.Modules.ShowPassword.prototype.init) {
        new DI.Modules.ShowPassword(modules[i]).init();
      }
    }
  }

  var onIntNumberSelected = function(intPhoneNumberCheckbox, phoneNumberInput) {
    if (intPhoneNumberCheckbox.checked) {
      phoneNumberInput.value = "";
      phoneNumberInput.disabled = true;
      phoneNumberInput.classList.add("govuk-input--disabled");
    } else {
      phoneNumberInput.disabled = false;
      phoneNumberInput.classList.remove("govuk-input--disabled");
    }
  };
  
  function initChangePhoneNumber() {
    var phoneNumberInput = document.querySelector('#phoneNumber');
    if (phoneNumberInput) {
      var intPhoneNumberCheckbox = document.querySelector('#hasInternationalPhoneNumber');
      intPhoneNumberCheckbox.addEventListener("click", function(event) {
        onIntNumberSelected(event.currentTarget, phoneNumberInput);
      });
      window.addEventListener("load", onIntNumberSelected(intPhoneNumberCheckbox, phoneNumberInput));
    }
  }
  initChangePhoneNumber();

  w.DI.appInit = appInit;
})(window);