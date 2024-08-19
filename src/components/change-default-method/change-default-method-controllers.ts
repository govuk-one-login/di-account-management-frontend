import { NextFunction, Request, Response } from "express";
import { getLastNDigits } from "../../utils/phone-number";
import {
  generateSessionDetails,
  handleMfaMethodPage,
  renderMfaMethodPage,
} from "../common/mfa";
import { updateMfaMethod } from "../../utils/mfa";
import { EventType, getNextState } from "../../utils/state-machine";
import { PATH_DATA } from "../../app.constants";
import { UpdateInformationInput } from "../../utils/types";

const ADD_APP_TEMPLATE = "change-default-method/change-to-app.njk";

export async function changeDefaultMethodGet(
  req: Request,
  res: Response
): Promise<void> {
  const defaultMethod = req.session.mfaMethods.find(
    (method) => method.priorityIdentifier === "DEFAULT"
  );

  if (!defaultMethod) {
    res.status(404);
    return;
  }

  const data = {
    currentMethodType: defaultMethod.method.mfaMethodType,
    phoneNumber:
      defaultMethod.method.mfaMethodType === "SMS"
        ? getLastNDigits(defaultMethod.method.endPoint, 4)
        : null,
  };

  res.render("change-default-method/index.njk", data);
}

export async function changeDefaultMethodAppGet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  return renderMfaMethodPage(ADD_APP_TEMPLATE, req, res, next);
}

export async function changeDefaultMethodAppPost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  return handleMfaMethodPage(ADD_APP_TEMPLATE, req, res, next, async () => {
    const { code, authAppSecret } = req.body;

    const updateInput: UpdateInformationInput = {
      otp: code,
      credential: authAppSecret,
      mfaMethod: {
        priorityIdentifier: "DEFAULT",
        method: {
          mfaMethodType: "AUTH_APP",
        },
      },
      email: "",
    };

    const sessionDetails = await generateSessionDetails(req, res);
    await updateMfaMethod(updateInput, sessionDetails);

    req.session.user.state.changeDefaultMethod = getNextState(
      req.session.user.state.changeDefaultMethod.value,
      EventType.ValueUpdated
    );

    res.redirect(PATH_DATA.CHANGE_DEFAULT_METHOD_CONFIRMATION.url);
  });
}
