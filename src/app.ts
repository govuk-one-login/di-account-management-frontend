import express from "express";
import cookieParser from "cookie-parser";
import csurf from "csurf";
import { loggerMiddleware } from "./utils/logger.js";
import { sanitizeRequestMiddleware } from "./middleware/sanitize-request-middleware.js";
import * as i18nextMiddleware from "i18next-http-middleware";
import * as path from "path";
import { configureNunjucks } from "./config/nunjucks.js";
import { i18nextConfigurationOptions } from "./config/i18next.js";
import {
  helmetConfiguration,
  webchatHelmetConfiguration,
} from "./config/helmet.js";
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
} from "./config.js";
import { logErrorMiddleware } from "./middleware/log-error-middleware.js";
import { pageNotFoundHandler } from "./handlers/page-not-found-handler.js";
import { serverErrorHandler } from "./handlers/internal-server-error-handler.js";
import { csrfMiddleware } from "./middleware/csrf-middleware.js";
import { securityRouter } from "./components/security/security-routes.js";
import { activityHistoryRouter } from "./components/activity-history/activity-history-routes.js";
import { yourServicesRouter } from "./components/your-services/your-services-routes.js";
import {
  getCSRFCookieOptions,
  getSessionCookieOptions,
} from "./config/cookie.js";
import { ENVIRONMENT_NAME } from "./app.constants.js";
import { startRouter } from "./components/start/start-routes.js";
import { oidcAuthCallbackRouter } from "./components/oidc-callback/call-back-routes.js";
import { authMiddleware } from "./middleware/auth-middleware.js";
import { logoutRouter } from "./components/logout/logout-routes.js";
import { getOIDCConfig } from "./config/oidc.js";
import { enterPasswordRouter } from "./components/enter-password/enter-password-routes.js";
import { changeEmailRouter } from "./components/change-email/change-email-routes.js";
import { updateConfirmationRouter } from "./components/update-confirmation/update-confirmation-routes.js";
import { changePasswordRouter } from "./components/change-password/change-password-routes.js";
import { checkYourEmailRouter } from "./components/check-your-email/check-your-email-routes.js";
import { changePhoneNumberRouter } from "./components/change-phone-number/change-phone-number-routes.js";
import { changeAuthenticatorAppRouter } from "./components/change-authenticator-app/change-authenticator-app-routes.js";
import { deleteAccountRouter } from "./components/delete-account/delete-account-routes.js";
import { checkYourPhoneRouter } from "./components/check-your-phone/check-your-phone-routes.js";
import { noCacheMiddleware } from "./middleware/no-cache-middleware.js";
import { sessionExpiredRouter } from "./components/session-expired/session-expired-routes.js";
import { signedOutRouter } from "./components/signed-out/signed-out-routes.js";
import { setLocalVarsMiddleware } from "./middleware/set-local-vars-middleware.js";
import { healthcheckRouter } from "./components/healthcheck/healthcheck-routes.js";
import { globalLogoutRouter } from "./components/global-logout/global-logout-routes.js";
import { resendEmailCodeRouter } from "./components/resend-email-code/resend-email-code-routes.js";
import { resendPhoneCodeRouter } from "./components/resend-phone-code/resend-phone-code-routes.js";
import { redirectsRouter } from "./components/redirects/redirects-routes.js";
import { contactRouter } from "./components/contact-govuk-one-login/contact-govuk-one-login-routes.js";
import { getSessionStore } from "./utils/session-store.js";
import { outboundContactUsLinksMiddleware } from "./middleware/outbound-contact-us-links-middleware.js";
import { trackAndRedirectRouter } from "./components/track-and-redirect/track-and-redirect-route.js";
import { reportSuspiciousActivityRouter } from "./components/report-suspicious-activity/report-suspicious-activity-routes.js";
import { addMfaMethodRouter } from "./components/add-mfa-method/add-mfa-method-routes.js";
import { addMfaMethodAppRouter } from "./components/add-mfa-method-app/add-mfa-method-app-routes.js";
import { csrfErrorHandler } from "./handlers/csrf-error-handler.js";
import { languageToggleMiddleware } from "./middleware/language-toggle-middleware.js";
import { safeTranslate } from "./utils/safeTranslate.js";

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
