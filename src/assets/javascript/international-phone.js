(function (w) {
  "use strict";
  var onIntNumberSelected = function (
    intPhoneNumberCheckbox,
    phoneNumberInput
  ) {
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
    var phoneNumberInput = document.querySelector("#phoneNumber");
    if (phoneNumberInput) {
      var intPhoneNumberCheckbox = document.querySelector(
        "#hasInternationalPhoneNumber"
      );
      intPhoneNumberCheckbox.addEventListener("click", function (event) {
        onIntNumberSelected(event.currentTarget, phoneNumberInput);
      });
      window.addEventListener(
        "load",
        onIntNumberSelected(intPhoneNumberCheckbox, phoneNumberInput)
      );
    }
  }
  initChangePhoneNumber();
})(window);
