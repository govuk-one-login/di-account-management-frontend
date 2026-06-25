import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types.js";
import { PATH_DATA, ERROR_CODES } from "../../app.constants.js";
import { ChangePasswordServiceInterface } from "./types.js";
import { changePasswordService } from "./change-password-service.js";
import { getPasswordJourneyRenderOptions } from "../../utils/getPasswordJourneyRenderOptions.js";
import { EventType, getNextState } from "../../utils/state-machine.js";
import {
  renderBadRequest,
  formatValidationError,
} from "../../utils/validation.js";
import { BadRequestError } from "../../utils/errors.js";
import { getRequestConfigFromExpress } from "../../utils/http.js";
import {
  CHANGE_PASSWORD_COMMON_OPL_SETTINGS,
  setOplSettings,
} from "../../utils/opl.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
const changePasswordTemplate = "change-password/index.njk"; //pragma: allowlist secret

const setLocalOplSettings = (res: Response) => {
  setOplSettings(
    {
      ...CHANGE_PASSWORD_COMMON_OPL_SETTINGS,
      contentId: "00ca6657-4139-43fa-979b-0eb3576fa94c",
    },
    res
  );
};

export function changePasswordGet(req: Request, res: Response): void {
  req.metrics?.addMetric("changePasswordGet", MetricUnit.Count, 1);
  setLocalOplSettings(res);
  res.render(changePasswordTemplate, getPasswordJourneyRenderOptions(req));
}

export function changePasswordPost(
  service: ChangePasswordServiceInterface = changePasswordService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    req.metrics?.addMetric("changePasswordPost", MetricUnit.Count, 1);
    setLocalOplSettings(res);
    const { email } = req.session.user;
    const confirmationPageUrl = PATH_DATA.PASSWORD_UPDATED_CONFIRMATION.url;
    const renderOptions = getPasswordJourneyRenderOptions(req);
    const searchParams = new URLSearchParams();

    if (renderOptions.from) {
      searchParams.set("from", renderOptions.from);
    }
    if (renderOptions.page) {
      searchParams.set("page", renderOptions.page.toString());
    }

    const redirectUrl =
      searchParams.size > 0
        ? `${confirmationPageUrl}?${searchParams.toString()}`
        : confirmationPageUrl;

    const newPassword = req.body.password as string;
    const response = await service.updatePassword(
      email,
      newPassword,
      await getRequestConfigFromExpress(req, res)
    );

    if (response.success) {
      req.session.user.state.changePassword = getNextState(
        req.session.user.state.changePassword.value,
        EventType.ValueUpdated
      );

      return res.redirect(redirectUrl);
    }
    if (response.code === ERROR_CODES.NEW_PASSWORD_SAME_AS_EXISTING) {
      const error = formatValidationError(
        "password",
        req.t("pages.changePassword.password.validationError.samePassword")
      );
      return renderBadRequest(
        res,
        req,
        changePasswordTemplate,
        error,
        renderOptions
      );
    }
    if (response.code === ERROR_CODES.PASSWORD_IS_COMMON) {
      const error = formatValidationError(
        "password",
        req.t("pages.changePassword.password.validationError.commonPassword")
      );
      return renderBadRequest(
        res,
        req,
        changePasswordTemplate,
        error,
        renderOptions
      );
    } else {
      throw new BadRequestError(response.message, response.code);
    }
  };
}
