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
    window.addEventListener("load", function(event) {
      onIntNumberSelected(intPhoneNumberCheckbox, phoneNumberInput)
    });
  }
}
initChangePhoneNumber();

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