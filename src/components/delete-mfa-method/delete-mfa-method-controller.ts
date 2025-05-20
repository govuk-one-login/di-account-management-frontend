import { Request, Response } from "express";
import { HTTP_STATUS_CODES, PATH_DATA } from "../../app.constants";
import { getLastNDigits } from "../../utils/phone-number";
import { EventType, getNextState } from "../../utils/state-machine";
import { createMfaClient, formatErrorMessage } from "../../utils/mfaClient";

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
  });

  if (!methodToRemove || methodToRemove.priorityIdentifier !== "BACKUP") {
    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    return;
  }

  const mfaClient = createMfaClient(req, res);

  const response = await mfaClient.delete(methodToRemove);

  if (response.success) {
    req.session.user.state.removeBackup = getNextState(
      req.session.user.state.removeBackup.value,
      EventType.RemoveBackup
    );

    req.session.removedMfaMethod = methodToRemove;

    res.redirect(`${PATH_DATA.DELETE_MFA_METHOD_CONFIRMATION.url}`);
  } else if (response.error) {
    req.log.error(
      { trace: res.locals.trace },
      formatErrorMessage("Failed delete MFA", response)
    );
    throw new Error(response.error.message);
  } else {
    req.log.error({ trace: res.locals.trace }, "Failed delete MFA");
    throw new Error(`Error deleting MFA`);
  }
}
