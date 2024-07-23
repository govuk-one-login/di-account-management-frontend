import { Request, Response } from "express";
import { HTTP_STATUS_CODES, PATH_DATA } from "../../app.constants";
import { getLastNDigits } from "../../utils/phone-number";
import { EventType, getNextState } from "../../utils/state-machine";
import { changeDefaultMfaMethod } from "../../utils/mfa";
import { generateSessionDetails } from "../common/mfa";
import { logger } from "../../utils/logger";

export async function changeDefaultMfaMethodGet(
  req: Request,
  res: Response
): Promise<void> {
  let currentBackupPhoneNumber;
  const currentBackupMethod = req.session.mfaMethods.find((m) => {
    return m.priorityIdentifier === "BACKUP";
  });

  if (!currentBackupMethod) {
    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    return;
  }

  if (currentBackupMethod.method.mfaMethodType === "SMS") {
    currentBackupPhoneNumber = getLastNDigits(
      currentBackupMethod.method.endPoint,
      4
    );
  }

  let currentDefaultPhoneNumber;
  const currentDefaultMethod = req.session.mfaMethods.find((m) => {
    return m.priorityIdentifier === "DEFAULT";
  });

  if (!currentDefaultMethod) {
    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    return;
  }

  if (currentDefaultMethod.method.mfaMethodType === "SMS") {
    currentDefaultPhoneNumber = getLastNDigits(
      currentDefaultMethod.method.endPoint,
      4
    );
  }

  res.render("change-default-method/index.njk", {
    currentBackup: {
      ...currentBackupMethod,
      phoneNumber: currentBackupPhoneNumber,
    },
    currentDefault: {
      ...currentDefaultMethod,
      phoneNumber: currentDefaultPhoneNumber,
    },
  });
}

export async function changeDefaultMfaMethodPost(
  req: Request,
  res: Response
): Promise<void> {
  const { newDefault } = req.body;

  const newDefaultMethod = req.session.mfaMethods.find(
    (m) => m.mfaIdentifier == newDefault
  );

  if (!newDefaultMethod) {
    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    return;
  }

  try {
    await changeDefaultMfaMethod(
      newDefaultMethod.mfaIdentifier,
      await generateSessionDetails(req, res)
    );
  } catch (e) {
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    logger.error("error updating default MFA method", e.message);
    return;
  }

  req.session.user.state.switchBackupMethod = getNextState(
    req.session.user.state.switchBackupMethod.value,
    EventType.ValueUpdated
  );

  req.session.newDefaultMfaMethodId = newDefaultMethod.mfaIdentifier;

  res.redirect(PATH_DATA.CHANGE_DEFAULT_METHOD_CONFIRMATION.url);
}
