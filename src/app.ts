import express from "express";
import cookieParser from "cookie-parser";
import csurf from "csurf";
import { loggerMiddleware } from "./utils/logger";
import { sanitizeRequestMiddleware } from "./middleware/sanitize-request-middleware";
import i18nextMiddleware from "i18next-http-middleware";
import * as path from "path";
import { configureNunjucks } from "./config/nunjucks";
import { i18nextConfigurationOptions } from "./config/i18next";
import {
  helmetConfiguration,
  webchatHelmetConfiguration,
} from "./config/helmet";
import helmet from "helmet";
import session from "express-session";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import {
  getNodeEnv,
  getSessionExpiry,
  getSessionSecret,
  supportActivityLog,
  supportChangeMfa,
  supportTriagePage,
  supportWebchatContact,
} from "./config";
import { logErrorMiddleware } from "./middleware/log-error-middleware";
import { pageNotFoundHandler } from "./handlers/page-not-found-handler";
import { serverErrorHandler } from "./handlers/internal-server-error-handler";
import { csrfMiddleware } from "./middleware/csrf-middleware";
import { securityRouter } from "./components/security/security-routes";
import { activityHistoryRouter } from "./components/activity-history/activity-history-routes";
import { yourServicesRouter } from "./components/your-services/your-services-routes";
import { getCSRFCookieOptions, getSessionCookieOptions } from "./config/cookie";
import { ENVIRONMENT_NAME } from "./app.constants";
import { startRouter } from "./components/start/start-routes";
import { oidcAuthCallbackRouter } from "./components/oidc-callback/call-back-routes";
import { authMiddleware } from "./middleware/auth-middleware";
import { logoutRouter } from "./components/logout/logout-routes";
import { getOIDCConfig } from "./config/oidc";
import { enterPasswordRouter } from "./components/enter-password/enter-password-routes";
import { changeEmailRouter } from "./components/change-email/change-email-routes";
import { updateConfirmationRouter } from "./components/update-confirmation/update-confirmation-routes";
import { changePasswordRouter } from "./components/change-password/change-password-routes";
import { checkYourEmailRouter } from "./components/check-your-email/check-your-email-routes";
import { changePhoneNumberRouter } from "./components/change-phone-number/change-phone-number-routes";
import { changeAuthenticatorAppRouter } from "./components/change-authenticator-app/change-authenticator-app-routes";
import { deleteAccountRouter } from "./components/delete-account/delete-account-routes";
import { checkYourPhoneRouter } from "./components/check-your-phone/check-your-phone-routes";
import { noCacheMiddleware } from "./middleware/no-cache-middleware";
import { sessionExpiredRouter } from "./components/session-expired/session-expired-routes";
import { signedOutRouter } from "./components/signed-out/signed-out-routes";
import { setLocalVarsMiddleware } from "./middleware/set-local-vars-middleware";
import { healthcheckRouter } from "./components/healthcheck/healthcheck-routes";
import { globalLogoutRouter } from "./components/global-logout/global-logout-routes";
import { resendEmailCodeRouter } from "./components/resend-email-code/resend-email-code-routes";
import { resendPhoneCodeRouter } from "./components/resend-phone-code/resend-phone-code-routes";
import { redirectsRouter } from "./components/redirects/redirects-routes";
import { contactRouter } from "./components/contact-govuk-one-login/contact-govuk-one-login-routes";
import { getSessionStore } from "./utils/session-store";
import { outboundContactUsLinksMiddleware } from "./middleware/outbound-contact-us-links-middleware";
import { trackAndRedirectRouter } from "./components/track-and-redirect/track-and-redirect-route";
import { reportSuspiciousActivityRouter } from "./components/report-suspicious-activity/report-suspicious-activity-routes";
import { addMfaMethodRouter } from "./components/add-mfa-method/add-mfa-method-routes";
import { addMfaMethodAppRouter } from "./components/add-mfa-method-app/add-mfa-method-app-routes";
import { csrfErrorHandler } from "./handlers/csrf-error-handler";
import { languageToggleMiddleware } from "./middleware/language-toggle-middleware";
import { safeTranslate } from "./utils/safeTranslate";
import { addMfaMethodSmsRouter } from "./components/add-mfa-method-sms/add-mfa-method-sms-routes";
import { deleteMfaMethodRouter } from "./components/delete-mfa-method/delete-mfa-method-routes";
import { changeDefaultMethodRouter } from "./components/change-default-method/change-default-method-routes";

const APP_VIEWS = [
  path.join(__dirname, "components"),
  path.resolve("node_modules/govuk-frontend/"),
  path.resolve("node_modules/@govuk-one-login/"),
];

async function createApp(): Promise<express.Application> {
  const app: express.Application = express();
  const isProduction = getNodeEnv() === ENVIRONMENT_NAME.PROD;

  app.enable("trust proxy");

  app.use(outboundContactUsLinksMiddleware);

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use(cookieParser());
  app.use(setLocalVarsMiddleware);
  app.use(loggerMiddleware);

  app.use((req, res, next) => {
    req.log = req.log.child({
      trace: res.locals.trace,
    });
    next();
  });

  app.use(
    "/assets",
    express.static(path.resolve("node_modules/govuk-frontend/govuk/assets"))
  );

  app.use("/public", express.static(path.join(__dirname, "public")));
  app.set("view engine", configureNunjucks(app, APP_VIEWS));

  app.use(noCacheMiddleware);

  await i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init(
      i18nextConfigurationOptions(
        path.join(__dirname, "locales/{{lng}}/{{ns}}.json")
      )
    );

  app.use(i18nextMiddleware.handle(i18next));
  if (supportWebchatContact()) {
    app.use(helmet(webchatHelmetConfiguration));
  } else {
    app.use(helmet(helmetConfiguration));
  }

  app.use((req, res, next) => {
    const translate = req.t.bind(req);
    req.t = (key: string): string => {
      return safeTranslate(translate, key, req.language, {}) as string;
    };
    next();
  });

  app.use(languageToggleMiddleware);

  const sessionStore = getSessionStore({ session: session });
  app.use(
    session({
      name: "am",
      store: sessionStore,
      saveUninitialized: false,
      secret: getSessionSecret(),
      resave: false,
      unset: "destroy",
      cookie: getSessionCookieOptions(
        isProduction,
        getSessionExpiry(),
        getSessionSecret()
      ),
    })
  );

  app.locals.sessionStore = sessionStore;

  app.use(healthcheckRouter);
  app.use(authMiddleware(getOIDCConfig()));
  app.use(globalLogoutRouter);
  app.use(csurf({ cookie: getCSRFCookieOptions(isProduction) }));

  app.post("*", sanitizeRequestMiddleware);
  app.use(csrfMiddleware);

  app.use(securityRouter);
  app.use(yourServicesRouter);
  app.use(oidcAuthCallbackRouter);
  app.use(startRouter);
  app.use(logoutRouter);
  app.use(enterPasswordRouter);
  app.use(changeEmailRouter);
  app.use(updateConfirmationRouter);
  app.use(changePasswordRouter);
  app.use(checkYourEmailRouter);
  app.use(changePhoneNumberRouter);
  app.use(deleteAccountRouter);
  app.use(checkYourPhoneRouter);
  app.use(sessionExpiredRouter);
  app.use(signedOutRouter);
  app.use(resendEmailCodeRouter);
  app.use(resendPhoneCodeRouter);
  if (supportActivityLog()) {
    app.use(activityHistoryRouter);
    app.use(reportSuspiciousActivityRouter);
  }
  if (supportTriagePage()) {
    app.use(contactRouter);
  }
  if (supportChangeMfa()) {
    app.use(addMfaMethodRouter);
    app.use(addMfaMethodAppRouter);
    app.use(addMfaMethodSmsRouter);
    app.use(deleteMfaMethodRouter);
    app.use(changeDefaultMethodRouter);
  }
  app.use(changeAuthenticatorAppRouter);
  app.use(trackAndRedirectRouter);

  // Router for all previously used URLs, that we want to redirect on
  // No URL left behind policy
  app.use(redirectsRouter);
  app.use(pageNotFoundHandler);

  app.use(csrfErrorHandler);
  app.use(logErrorMiddleware);
  app.use(serverErrorHandler);

  return app;
}

export { createApp };
