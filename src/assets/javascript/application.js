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


window.DI = window.DI || {};
window.DI.analyticsUa = window.DI.analyticsUa || {};
(function (w) {
  "use strict";

  function appInit() {
    window.GOVUKFrontend.initAll();

    var cookies = window.GOVSignIn.Cookies();
    if (window.DI.analyticsGa4.cookie.hasConsentForAnalytics()) {
      cookies.initAnalytics();
    }
  }

  if (w.GOVSignIn && w.GOVSignIn.Modules && w.GOVSignIn.Modules.ShowPassword) {
    var modules = document.querySelectorAll('[data-module="show-password"]');

    for (var i = 0, l = modules.length; i < l; i++) {
      if (GOVSignIn.Modules.ShowPassword.prototype.init) {
        new GOVSignIn.Modules.ShowPassword(modules[i]).init();
      }
    }
  }

  w.DI.analyticsUa.init = appInit;
})(window);
  
