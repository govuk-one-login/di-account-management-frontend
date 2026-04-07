import { Request, Response } from "express";
import { maxNumberOfPasskeys } from "../../config.js";
import { PATH_DATA } from "../../app.constants.js";
import { createMfaClient } from "../../utils/mfaClient/index.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { UserJourney } from "../../utils/state-machine.js";
import { formatPasskeysForRender } from "../../utils/passkeys/index.js";
import {
  mapMfaMethods,
  canChangePrimaryMethod,
} from "../../utils/mfa/index.js";

export async function signInDetailsGet(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric("signInDetailsGet", MetricUnit.Count, 1);
  const mfaClient = await createMfaClient(req, res);
  const passkeys = await mfaClient.getPasskeys();
  const { email } = req.session.user;
  const enterPasswordUrl = `${PATH_DATA.ENTER_PASSWORD.url}?from=sign-in-details&edit=true`;

  const enterPasswordUrls = {
    changeEmail: `${enterPasswordUrl}&type=${UserJourney.ChangeEmail}`,
    createPasskey: `${enterPasswordUrl}&type=${UserJourney.CreatePasskey}`,
    removePasskey: `${enterPasswordUrl}&type=${UserJourney.RemovePasskey}`,
    changePassword: `${enterPasswordUrl}&type=${UserJourney.ChangePassword}`,
    changeDefaultMethod: `${enterPasswordUrl}&type=${UserJourney.ChangeDefaultMethod}`,
    switchBackupMethod: `${enterPasswordUrl}&type=${UserJourney.SwitchBackupMethod}`,
    removeBackupMethod: `${enterPasswordUrl}&type=${UserJourney.RemoveBackup}`,
    addBackupMethod: `${enterPasswordUrl}&type=${UserJourney.addBackup}`,
  };
  const mfaMethods = Array.isArray(req.session.mfaMethods)
    ? mapMfaMethods(req.session.mfaMethods, enterPasswordUrl, req.t)
    : [];

  const denyChangeTypeofPrimary = Array.isArray(req.session.mfaMethods)
    ? canChangePrimaryMethod(req.session.mfaMethods)
    : false;

  const formattedPasskeys = await formatPasskeysForRender(req, passkeys.data);

  res.render("sign-in-details/index.njk", {
    email,
    mfaMethods,
    canChangeTypeofPrimary: !denyChangeTypeofPrimary,
    passkeys: formattedPasskeys,
    enterPasswordUrls,
    maxNumberOfPasskeys,
  });
}
