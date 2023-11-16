import { Header } from 'govuk-frontend/dist/govuk/components/header/header.mjs';
import { Button } from 'govuk-frontend/dist/govuk/components/button/button.mjs';
import { ErrorSummary } from 'govuk-frontend/dist/govuk/components/error-summary/error-summary.mjs';
import { Checkboxes } from 'govuk-frontend/dist/govuk/components/checkboxes/checkboxes.mjs';
import { ShowPassword } from './showPassword.js'; 

((w) => {
  "use strict";

  // initialise components 
  const components = [Header, Button,Checkboxes,ErrorSummary, ShowPassword];

  for (const component of components) {
    let currentModule = document.querySelectorAll(`[data-module='${component.moduleName}']`);
    if (component && currentModule) {
      for (let i = 0; i < currentModule.length; i++) {
        new component(currentModule[i]);
      }
    }
  }
 
  // end initialise components

  // handle international phone numbers on the "Change phone number" page 
  function onIntNumberSelected(intPhoneNumberCheckbox, phoneNumberInput) {
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
    const phoneNumberInput = document.querySelector('#phoneNumber');

    if (phoneNumberInput) {
      const intPhoneNumberCheckbox = document.querySelector('#hasInternationalPhoneNumber');
      if (intPhoneNumberCheckbox) { 
        intPhoneNumberCheckbox.addEventListener("click", function(event) {
          onIntNumberSelected(event.currentTarget, phoneNumberInput);
        });
        window.addEventListener("load", onIntNumberSelected(intPhoneNumberCheckbox, phoneNumberInput));
      }
    }
  }
  initChangePhoneNumber();
})(window);