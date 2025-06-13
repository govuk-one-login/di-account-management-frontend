import { NextFunction, Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";
import { EventType, getNextState } from "../../utils/state-machine";
import { handleMfaMethodPage, renderMfaMethodPage } from "../common/mfa";
import { createMfaClient, formatErrorMessage } from "../../utils/mfaClient";
import { AuthAppMethod } from "../../utils/mfaClient/types";
import { MFA_COMMON_OPL_SETTINGS, setOplSettings } from "../../utils/opl";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

const ADD_MFA_METHOD_AUTH_APP_TEMPLATE = "add-mfa-method-app/index.njk";

const backLink = PATH_DATA.ADD_MFA_METHOD_GO_BACK.url;

export async function addMfaMethodGoBackGet(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric("addMfaMethodGoBackGet", MetricUnit.Count, 1);
  req.session.user.state.addBackup = getNextState(
    req.session.user.state.addBackup.value,
    EventType.GoBackToChooseBackup
  );
  return res.redirect(PATH_DATA.ADD_MFA_METHOD.url);
}

const setLocalOplSettings = (res: Response) => {
  setOplSettings(
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "c393c909-373f-47b8-a768-32f23dca81ae",
    },
    res
  );
};

export async function addMfaAppMethodGet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  req.metrics?.addMetric("addMfaAppMethodGet", MetricUnit.Count, 1);
  setLocalOplSettings(res);

  return renderMfaMethodPage(
    ADD_MFA_METHOD_AUTH_APP_TEMPLATE,
    req,
    res,
    next,
    undefined,
    backLink
  );
}

export async function addMfaAppMethodPost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  req.metrics?.addMetric("addMfaAppMethodPost", MetricUnit.Count, 1);
  return handleMfaMethodPage(
    ADD_MFA_METHOD_AUTH_APP_TEMPLATE,
    req,
    res,
    next,
    async () => {
      setLocalOplSettings(res);

      try {
        const { authAppSecret } = req.body;

        const newMethod: AuthAppMethod = {
          mfaMethodType: "AUTH_APP",
          credential: authAppSecret,
        };

        const mfaClient = createMfaClient(req, res);
        const response = await mfaClient.create(newMethod);

        if (!response.success) {
          const errorMessage = formatErrorMessage(
            "Failed to add MFA method",
            response
          );
          req.log.error({ trace: res.locals.trace }, errorMessage);
          throw new Error(errorMessage);
        }

        req.session.user.state.addBackup = getNextState(
          req.session.user.state.addBackup.value,
          EventType.ValueUpdated
        );
        return res.redirect(PATH_DATA.ADD_MFA_METHOD_APP_CONFIRMATION.url);
      } catch (error) {
        req.log.error(error);
        return next(error);
      }
    },
    backLink
  );
}
