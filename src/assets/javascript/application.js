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

  if (w.GOVSignIn && w.GOVSignIn.Modules && w.GOVSignIn.Modules.ShowPassword) {
    var modules = document.querySelectorAll('[data-module="show-password"]');

    for (var i = 0, l = modules.length; i < l; i++) {
      if (GOVSignIn.Modules.ShowPassword.prototype.init) {
        new GOVSignIn.Modules.ShowPassword(modules[i]).init();
      }
    }
  }

  w.GOVSignIn.appInit = appInit;
})(window);