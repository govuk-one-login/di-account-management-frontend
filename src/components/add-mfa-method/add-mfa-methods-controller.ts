import { Request, Response, NextFunction } from "express";
import { MFA_METHODS } from "../../app.constants";
import { getNextState } from "../../utils/state-machine";

type MfaMethods = keyof typeof MFA_METHODS;

const ADD_METHOD_TEMPLATE = `add-mfa-method/index.njk`;

export function addMfaMethodGet(req: Request, res: Response): void {
  const helpTextDefault = `<p>${req.t("pages.addMfaMethod.app.help.text1")}</p><p>${req.t("pages.addMfaMethod.app.help.text2")}</p>`;

  const userMethods = req.session.mfaMethods || [];

  if (userMethods.length === 2) {
    // the user shouldn't get here as they can only have 2 methods
    res.status(500);
    res.end();
    return;
  }

  if (userMethods.length === 1) {
    if (userMethods[0].mfaMethodType === "AUTH_APP") {
      res.render(ADD_METHOD_TEMPLATE, {
        mfaMethods: [],
        message: req.t("pages.addMfaMethod.backup.sms.message"),
        addMethodButtonLabel: req.t("pages.addMfaMethod.backup.sms.button"),
        addMfaMethod: MFA_METHODS.SMS.type,
        showSingleMethod: true,
      });
      return;
    }
  }

  const mfaMethods = Object.keys(MFA_METHODS).map((key, index) => {
    const method = MFA_METHODS[key as MfaMethods];
    return {
      value: method.type,
      text: req.t(`pages.addMfaMethod.${method.type}.title`),
      hint: {
        text: req.t(`pages.addMfaMethod.${method.type}.hint`),
      },
      checked: index === 0,
    };
  });
  res.render(ADD_METHOD_TEMPLATE, {
    helpText: helpTextDefault,
    mfaMethods,
  });
}

export function addMfaMethodPost(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { addMfaMethod } = req.body;

  const method = Object.keys(MFA_METHODS).find((key: MfaMethods) => {
    return MFA_METHODS[key].type === addMfaMethod;
  });

  if (!method) {
    req.log.error(`unknown addMfaMethod: ${addMfaMethod}`);
    return next(new Error(`Unknown addMfaMethod: ${addMfaMethod}`));
  }

  const selectedMfaMethod = MFA_METHODS[method as MfaMethods];
  req.session.user.state.addMfaMethod = getNextState(
    req.session.user.state.addMfaMethod.value,
    selectedMfaMethod.event
  );

  res.redirect(selectedMfaMethod.path.url);
  res.end();
}
