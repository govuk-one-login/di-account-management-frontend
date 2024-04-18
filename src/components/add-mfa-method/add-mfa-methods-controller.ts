import { Request, Response, NextFunction } from "express";
import { MFA_METHODS } from "../../app.constants";
import { getNextState } from "../../utils/state-machine";

type MfaMethods = keyof typeof MFA_METHODS;

export function addMfaMethodGet(req: Request, res: Response): void {
  const helpText = `<p>${req.t("pages.addMfaMethod.app.help.text1")}</p><p>${req.t("pages.addMfaMethod.app.help.text2")}</p>`;

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
  res.render(`add-mfa-method/index.njk`, { helpText, mfaMethods });
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
