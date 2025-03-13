"use strict";

var cookies = function () {
  function initAnalytics() {
    window.DI.analyticsGa4.loadGtmScript(window.DI.analyticsGa4.uaContainerId);
    initGtm();
  }

  function pushLanguageToDataLayer() {
    var languageCode =
      document.querySelector("html") &&
      document.querySelector("html").getAttribute("lang");

    var languageNames = {
      en: "english",
      cy: "welsh",
    };

    if (languageCode && languageNames[languageCode]) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "langEvent",
        language: languageNames[languageCode],
        languagecode: languageCode,
      });
    }
  }

  function initGtm() {
    window.dataLayer = [
      {
        "gtm.allowlist": ["google"],
        "gtm.blocklist": ["adm", "awct", "sp", "gclidw", "gcs", "opt"],
      },
      {
        department: {
          programmeteam: "di",
          productteam: "sso",
        },
      },
    ];

    function addSessionJourneyToDataLayer(url) {
      const sessionJourney = getJourneyMapping(url);

      if (sessionJourney) {
        window.dataLayer.push(sessionJourney);
      }
    }

    const url = window.location.search.includes("type")
      ? window.location.pathname + window.location.search
      : window.location.pathname;

    addSessionJourneyToDataLayer(url);

    function gtag(obj) {
      dataLayer.push(obj);
    }

    pushLanguageToDataLayer();
    gtag({ "gtm.start": new Date().getTime(), event: "gtm.js" });

    var govAccountsLink = document.getElementById("gov-uk-accounts-link");

    if (govAccountsLink) {
      govAccountsLink.addEventListener("click", function () {
        var tracker = ga.getAll()[0];
        var linker = new window.gaplugins.Linker(tracker);
        var destinationLink = linker.decorate(govAccountsLink.href);
        window.location.href = destinationLink;
      });
    }
  }

  function generateJourneySession(type, status) {
    return {
      sessionjourney: {
        journey: "account management",
        type: type,
        status: status,
      },
    };
  }

  function getJourneyMapping(url) {
    const JOURNEY_DATA_LAYER_PATHS = {
      "/manage-your-account": {
        sessionjourney: {
          journey: "account management",
        },
      },
      "/enter-password?type=changeEmail&edit=true": generateJourneySession(
        "change email",
        "start"
      ),
      "/change-email": generateJourneySession("change email", "middle"),
      "/check-your-email": generateJourneySession("change email", "middle"),
      "/email-updated-confirmation": generateJourneySession(
        "change email",
        "end"
      ),
      "/enter-password?type=changePhoneNumber&edit=true":
        generateJourneySession("change phone number", "start"),
      "/change-phone-number": generateJourneySession(
        "change phone number",
        "middle"
      ),
      "/check-your-phone": generateJourneySession(
        "change phone number",
        "middle"
      ),
      "/phone-number-updated-confirmation": generateJourneySession(
        "change phone number",
        "end"
      ),
      "/enter-password?type=changePassword&edit=true": generateJourneySession(
        "change password",
        "start"
      ),
      "/change-password": generateJourneySession("change password", "middle"),
      "/password-updated-confirmation": generateJourneySession(
        "change password",
        "end"
      ),
      "/enter-password?type=deleteAccount": generateJourneySession(
        "delete account",
        "start"
      ),
      "/delete-account": generateJourneySession("delete account", "middle"),
      "/account-deleted-confirmation": generateJourneySession(
        "delete account",
        "end"
      ),
      "/change-authenticator-app": generateJourneySession(
        "change authenticator app",
        "middle"
      ),
      "/authenticator-app-updated-confirmation": generateJourneySession(
        "change authenticator app",
        "end"
      ),
    };

    return JOURNEY_DATA_LAYER_PATHS[url];
  }

  return {
    initAnalytics,
  };
};

window.GOVSignIn = window.GOVSignIn || {};
window.GOVSignIn.Cookies = cookies;
