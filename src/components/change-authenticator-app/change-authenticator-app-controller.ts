import { NextFunction, Request, Response } from "express";
import { mfaOplTaxonomies, PATH_DATA } from "../../app.constants";
import { EventType, getNextState } from "../../utils/state-machine";
import { MfaMethod } from "../../utils/mfaClient/types";
import { createMfaClient, formatErrorMessage } from "../../utils/mfaClient";
import { logger } from "../../utils/logger";
import { handleMfaMethodPage, renderMfaMethodPage } from "../common/mfa";

const CHANGE_AUTHENTICATOR_APP_TEMPLATE = "change-authenticator-app/index.njk";

const oplValues = {
  contentId: "673fc9b6-3c25-4ab2-8963-fde55432f7d5",
  ...mfaOplTaxonomies,
};

export async function changeAuthenticatorAppGet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  return renderMfaMethodPage(
    CHANGE_AUTHENTICATOR_APP_TEMPLATE,
    req,
    res,
    next,
    undefined,
    undefined,
    oplValues
  );
}

export async function changeAuthenticatorAppPost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  return handleMfaMethodPage(
    CHANGE_AUTHENTICATOR_APP_TEMPLATE,
    req,
    res,
    next,
    async () => {
      const { authAppSecret } = req.body;

      const authAppMFAMethod: MfaMethod = req.session.mfaMethods.find(
        (mfa) => mfa.method.mfaMethodType === "AUTH_APP"
      );

      if (!authAppMFAMethod) {
        const errorMessage =
          "Could not change authenticator app - no existing auth app method found";
        logger.error(errorMessage, { trace: res.locals.trace });
        throw new Error(errorMessage);
      }

      const mfaClient = createMfaClient(req, res);
      const response = await mfaClient.update({
        mfaIdentifier: authAppMFAMethod.mfaIdentifier,
        priorityIdentifier: authAppMFAMethod.priorityIdentifier,
        method: {
          mfaMethodType: "AUTH_APP",
          credential: authAppSecret,
        },
      });

      if (!response.success) {
        const errorMessage = formatErrorMessage(
          "Could not change authenticator app",
          response
        );
        logger.error(errorMessage, { trace: res.locals.trace });
        throw new Error(errorMessage);
      }

      req.session.user.authAppSecret = authAppSecret;

      req.session.user.state.changeAuthApp = getNextState(
        req.session.user.state.changeAuthApp.value,
        EventType.ValueUpdated
      );

      return res.redirect(PATH_DATA.AUTHENTICATOR_APP_UPDATED_CONFIRMATION.url);
    },
    undefined,
    oplValues
  );
}
