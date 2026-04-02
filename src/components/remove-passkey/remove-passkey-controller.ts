import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { getLastNDigits } from "../../utils/phone-number.js";
import { EventType, getNextState } from "../../utils/state-machine.js";
import {
  mfaMethodTypes,
  mfaPriorityIdentifiers,
} from "../../utils/mfaClient/types.js";

export async function removePasskeyGet(req: Request, res: Response): Promise<void> {
  req.metrics?.addMetric("removePasskeyGet", MetricUnit.Count, 1);

  const methods = req.session.mfaMethods;
  const defaultMethod = methods?.find(
      (method) => method.priorityIdentifier === mfaPriorityIdentifiers.default
    );

  const authIsDefaultMfa = defaultMethod.method.mfaMethodType === mfaMethodTypes.authApp;
  const phoneIsDefaultMfa = defaultMethod.method.mfaMethodType === mfaMethodTypes.sms;

  const truncatedPhoneNumber = phoneIsDefaultMfa && getLastNDigits(defaultMethod.method?.phoneNumber, 4);

  res.render("remove-passkey/index.njk", {
    passkey: { name: "Test", id: "1234"},
    hasOtherPasskey: false,
    authIsDefaultMfa,
    truncatedPhoneNumber
  });
}

export function removePasskeyPost(req: Request, res: Response): void {
  const success = true;
  
  // TODO IMPLEMENT REMOVE PASSKEY

  if (success) {
    req.session.user.state.changeEmail = getNextState(
      req.session.user.state.removePasskey.value,
      EventType.ValueUpdated
    );

    return res.redirect(PATH_DATA.PASSKEY_REMOVED_CONFIRMATION.url);
  }
}
