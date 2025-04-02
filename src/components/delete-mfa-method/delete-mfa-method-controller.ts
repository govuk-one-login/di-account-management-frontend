import { Request, Response } from "express";
import { HTTP_STATUS_CODES, PATH_DATA } from "../../app.constants";
import { getLastNDigits } from "../../utils/phone-number";
import { EventType, getNextState } from "../../utils/state-machine";
import MfaClient from "../../utils/mfaClient";
import { getRequestConfig } from "../../utils/http";
import { getTxmaHeader } from "../../utils/txma-header";
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

  const mfaClient = new MfaClient(
    req.session.user?.publicSubjectId,
    getRequestConfig({
      token: req.session.user.tokens.accessToken,
      sourceIp: req.ip,
      persistentSessionId: res.locals.persistentSessionId,
      sessionId: res.locals.sessionId,
      clientSessionId: res.locals.clientSessionId,
      txmaAuditEncoded: getTxmaHeader(req, res.locals.trace),
    })
  );

  const response = await mfaClient.delete(methodToRemove);

  if (response.success) {
    req.session.user.state.removeMfaMethod = getNextState(
      req.session.user.state.removeMfaMethod.value,
      EventType.RemoveBackup
    );

    req.session.removedMfaMethods = [methodToRemove];

    res.redirect(`${PATH_DATA.DELETE_MFA_METHOD_CONFIRMATION.url}`);
  } else {
    if (response.problem) {
      throw new Error(response.problem.title);
    } else {
      throw new Error(`Error deleting MFA`);
    }
  }
}
