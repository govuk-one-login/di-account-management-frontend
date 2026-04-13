import { Request, Response } from "express";
import { createMfaClient } from "../../utils/mfaClient/index.js";
import { maxNumberOfPasskeys } from "../../config.js";
import { PATH_DATA } from "../../app.constants.js";
import { initiateAmcRedirect } from "../../utils/initiateAmcRedirect.js";

export async function createNewPasskeyGet(
  req: Request,
  res: Response
): Promise<void> {
  const mfaClient = await createMfaClient(req, res);
  const passkeys = await mfaClient.getPasskeys();

  if (passkeys.data.length >= maxNumberOfPasskeys) {
    res.redirect(PATH_DATA.START.url);
    return;
  }

  await initiateAmcRedirect("passkey-create", req, res);
}
