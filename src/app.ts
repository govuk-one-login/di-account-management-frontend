import express, { Application } from "express";
import cookieParser from "cookie-parser";
import { logger, loggerMiddleware } from "./utils/logger.js";
import { sanitizeRequestMiddleware } from "./middleware/sanitize-request-middleware.js";
import * as i18nextMiddleware from "i18next-http-middleware";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { configureNunjucks } from "./config/nunjucks.js";
import { i18nextConfigurationOptions } from "./config/i18next.js";
import {
  helmetConfiguration,
  webchatHelmetConfiguration,
} from "./config/helmet.js";
import { csrfSynchronisedProtection } from "./config/csrf.js";
import helmet from "helmet";
import session from "express-session";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import {
  getAppEnv,
  isLocalEnv,
  getSessionExpiry,
  getSessionSecret,
  supportSearchableList,
  supportWebchatContact,
  supportGlobalLogout,
} from "./config.js";
import { logErrorMiddleware } from "./middleware/log-error-middleware.js";
import { pageNotFoundHandler } from "./handlers/page-not-found-handler.js";
import { serverErrorHandler } from "./handlers/internal-server-error-handler.js";
import { csrfMiddleware } from "./middleware/csrf-middleware.js";
import { securityRouter } from "./components/security/security-routes.js";
import { activityHistoryRouter } from "./components/activity-history/activity-history-routes.js";
import { yourServicesRouter } from "./components/your-services/your-services-routes.js";
import { getSessionCookieOptions } from "./config/cookie.js";
import { LOCALE, PATH_DATA } from "./app.constants.js";
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
import { backchannelLogoutRouter } from "./components/backchannel-logout/backchannel-logout-routes.js";
import { resendEmailCodeRouter } from "./components/resend-email-code/resend-email-code-routes.js";
import { resendPhoneCodeRouter } from "./components/resend-phone-code/resend-phone-code-routes.js";
import { redirectsRouter } from "./components/redirects/redirects-routes.js";
import { contactRouter } from "./components/contact-govuk-one-login/contact-govuk-one-login-routes.js";
import { temporarilySuspendedRouter } from "./components/temporarily-suspended/temporarily-suspended-routes.js";
import { permanentlySuspendedRouter } from "./components/permanently-suspended/permanently-suspended-routes.js";
import { getSessionStore } from "./utils/session-store.js";
import { outboundContactUsLinksMiddleware } from "./middleware/outbound-contact-us-links-middleware.js";
import { trackAndRedirectRouter } from "./components/track-and-redirect/track-and-redirect-route.js";
import { reportSuspiciousActivityRouter } from "./components/report-suspicious-activity/report-suspicious-activity-routes.js";
import { chooseBackupRouter } from "./components/choose-backup/choose-backup-routes.js";
import { addBackupAppRouter } from "./components/add-mfa-method-app/add-mfa-method-app-routes.js";
import { csrfErrorHandler } from "./handlers/csrf-error-handler.js";
import { languageToggleMiddleware } from "./middleware/language-toggle-middleware.js";
import { safeTranslate } from "./utils/safeTranslate.js";
import { addBackupSmsRouter } from "./components/add-mfa-method-sms/add-mfa-method-sms-routes.js";
import { deleteMfaMethodRouter } from "./components/delete-mfa-method/delete-mfa-method-routes.js";
import { switchBackupMethodRouter } from "./components/switch-backup-method/switch-backup-method-routes.js";
import { changeDefaultMethodRouter } from "./components/change-default-method/change-default-method-routes.js";
import { logoutRedirectRouter } from "./components/logout-redirect/logout-redirect-routes.js";
import { isUserLoggedInMiddleware } from "./middleware/is-user-logged-in-middleware.js";
import { applyOverloadProtection } from "./middleware/overload-protection-middleware.js";
import { frontendVitalSignsInit } from "@govuk-one-login/frontend-vital-signs";
import { Server } from "node:http";
import { searchServicesRouter } from "./components/search-services/search-services-routes.js";
import { getTranslations } from "di-account-management-rp-registry";
import { readFileSync } from "node:fs";
import { metricsMiddleware } from "./middleware/metrics-middlware.js";
import { globalLogoutRouter } from "./components/global-logout/global-logout-routes.js";
import {
  setBaseTranslations,
  setFrontendUiTranslations,
  frontendUiMiddleware,
  frontendUiTranslationCy,
  frontendUiTranslationEn,
} from "@govuk-one-login/frontend-ui";
import { monkeyPatchRedirectToSaveSessionMiddleware } from "./middleware/monkey-patch-redirect-to-save-session-middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const APP_VIEWS = [
  path.join(__dirname, "components"),
  path.resolve("node_modules/govuk-frontend/dist"),
  path.resolve("node_modules/@govuk-one-login/"),
];

async function createApp(): Promise<express.Application> {
  const app: express.Application = express();

  const isDeployedEnvironment = !isLocalEnv();
  app.use(metricsMiddleware());
  app.enable("trust proxy");

  // @ts-expect-error HttpLogger type from pino-http doesn't match Express middleware signature
  app.use(loggerMiddleware);

  if (isDeployedEnvironment) {
    const protect = applyOverloadProtection(isDeployedEnvironment);
    app.use(protect);
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Define the healthcheck and static routes first
  // Do not define a route or middleware before these unless there's a very good reason
  app.use(healthcheckRouter);
  app.use(
    "/assets",
    express.static(
      path.resolve("node_modules/govuk-frontend/dist/govuk/assets"),
      { maxAge: isLocalEnv() ? "0" : "1y" }
    )
  );

  app.use(
    PATH_DATA.FINGERPRINT.url,
    express.static(
      path.resolve(
        "node_modules/@govuk-one-login/frontend-device-intelligence/build/esm"
      )
    )
  );

  app.use(
    "/public",
    express.static(path.join(__dirname, "public"), {
      maxAge: isLocalEnv() ? "0" : "1y",
    })
  );
  app.use(cookieParser());

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
        isDeployedEnvironment,
        getSessionExpiry(),
        getSessionSecret()
      ),
    })
  );
  app.use(monkeyPatchRedirectToSaveSessionMiddleware);

  app.locals.sessionStore = sessionStore;

  app.use(setLocalVarsMiddleware);
  app.use(outboundContactUsLinksMiddleware);

  app.use((req, res, next) => {
    req.log = req.log.child({
      trace: res.locals.trace,
    });
    next();
  });

  app.set("nunjucksEngine", configureNunjucks(app, APP_VIEWS));
  app.use((req, res, next) => {
    const engine = res.app.get("nunjucksEngine");
    engine.addGlobal("request", req);
    engine.addGlobal("response", res);
    next();
  });

  app.use(noCacheMiddleware);

  await i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init(i18nextConfigurationOptions());

  const getTranslationObject = (locale: LOCALE) => {
    const translations = JSON.parse(
      readFileSync(
        path.join(__dirname, `locales/${locale}/translation.json`),
        "utf8"
      )
    );

    return {
      ...translations,
      clientRegistry: {
        [getAppEnv()]: getTranslations(getAppEnv(), locale),
      },
      FECTranslations:
        locale === LOCALE.CY
          ? frontendUiTranslationCy
          : frontendUiTranslationEn,
    };
  };

  i18next.addResourceBundle(
    LOCALE.CY,
    "translation",
    getTranslationObject(LOCALE.CY)
  );
  i18next.addResourceBundle(
    LOCALE.EN,
    "translation",
    getTranslationObject(LOCALE.EN)
  );

  setBaseTranslations(i18next);
  setFrontendUiTranslations(i18next);
  app.use(i18nextMiddleware.handle(i18next));
  app.use(frontendUiMiddleware);

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

  app.use(authMiddleware(getOIDCConfig()));

  app.use(backchannelLogoutRouter);
  // Must be added to the app after the session is set up and before the routers
  app.use(csrfSynchronisedProtection);

  app.post("/*splat", sanitizeRequestMiddleware);
  app.use(csrfMiddleware);

  app.use(securityRouter);
  app.use(yourServicesRouter);
  app.use(oidcAuthCallbackRouter);
  app.use(startRouter);
  app.use(logoutRedirectRouter);
  app.use(logoutRouter);
  app.use(isUserLoggedInMiddleware);
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

  if (supportGlobalLogout()) {
    app.use(globalLogoutRouter);
  }

  app.use(temporarilySuspendedRouter);
  app.use(permanentlySuspendedRouter);

  app.use(activityHistoryRouter);
  app.use(reportSuspiciousActivityRouter);

  app.use(contactRouter);
  app.use(chooseBackupRouter);
  app.use(addBackupAppRouter);
  app.use(addBackupSmsRouter);
  app.use(deleteMfaMethodRouter);
  app.use(switchBackupMethodRouter);
  app.use(changeAuthenticatorAppRouter);
  app.use(changeDefaultMethodRouter);

  if (supportSearchableList()) {
    app.use(searchServicesRouter);
  }
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

async function startServer(app: Application): Promise<{
  server: Server;
  closeServer: (callback?: (err?: Error) => void) => Promise<void>;
}> {
  const port: number | string = process.env.PORT || 6001;
  let server: Server;
  let stopVitalSigns: () => void;

  await new Promise<void>((resolve) => {
    server = app
      .listen(port, () => {
        logger.info(`Server listening on port ${port}`);
        app.emit("appStarted");
        resolve();
      })
      .on("error", (error: Error) => {
        logger.error(`Unable to start server because of ${error.message}`);
      });

    server.keepAliveTimeout = 61 * 1000;
    server.headersTimeout = 91 * 1000;

    stopVitalSigns = frontendVitalSignsInit(server, {
      staticPaths: [/^\/assets\/.*/, /^\/public\/.*/],
    });
  });

  const closeServer = async () => {
    if (stopVitalSigns) {
      stopVitalSigns();
      logger.info(`vital-signs stopped`);
    }
    await new Promise<void>((res, rej) =>
      server.close((err) => (err ? rej(err) : res()))
    );
  };

  return { server, closeServer };
}

const shutdownProcess =
  (closeServer: () => Promise<void>) => async (): Promise<void> => {
    try {
      logger.info("closing server");
      await closeServer();
      logger.info("server closed");
      process.exit(0);
    } catch (error) {
      logger.error(`error closing server: ${error.message}`);
      process.exit(1);
    }
  };

export { createApp, startServer, shutdownProcess };
