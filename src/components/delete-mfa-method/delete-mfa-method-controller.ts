import { Request, Response } from "express";
import { HTTP_STATUS_CODES, PATH_DATA } from "../../app.constants";
import { getLastNDigits } from "../../utils/phone-number";
import { EventType, getNextState } from "../../utils/state-machine";
import { createMfaClient } from "../../utils/mfaClient";
import { MfaMethod } from "../../utils/mfaClient/types";

export async function deleteMfaMethodGet(
  req: Request,
  res: Response
): Promise<void> {
  let phoneNumber;
  const backupMethod = req.session.mfaMethods.find((m) => {
    return m.priorityIdentifier === "BACKUP";
  });

  if (!backupMethod) {
    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    return;
  }

  if (backupMethod.method.mfaMethodType === "SMS") {
    phoneNumber = getLastNDigits(backupMethod.method.phoneNumber, 4);
  }

  res.render("delete-mfa-method/index.njk", { ...backupMethod, phoneNumber });
}

export async function deleteMfaMethodPost(
  req: Request,
  res: Response
): Promise<void> {
  const methodToRemove = req.session.mfaMethods.find((m) => {
    return req.body.methodId == m.mfaIdentifier;
  }) as unknown as MfaMethod;

  if (!methodToRemove || methodToRemove.priorityIdentifier !== "BACKUP") {
    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    return;
  }

  const mfaClient = createMfaClient(req, res);

  const response = await mfaClient.delete(methodToRemove);

  if (response.success) {
    req.session.user.state.removeMfaMethod = getNextState(
      req.session.user.state.removeMfaMethod.value,
      EventType.RemoveBackup
    );

    req.session.removedMfaMethods = [methodToRemove];

    res.redirect(`${PATH_DATA.DELETE_MFA_METHOD_CONFIRMATION.url}`);
  } else if (response.problem) {
    throw new Error(response.problem.title);
  } else {
    throw new Error(`Error deleting MFA`);
  }
}
