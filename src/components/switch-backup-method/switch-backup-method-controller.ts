import { Request, Response } from "express";
import { HTTP_STATUS_CODES, PATH_DATA } from "../../app.constants";
import { getLastNDigits } from "../../utils/phone-number";
import { EventType, getNextState } from "../../utils/state-machine";
import { logger } from "../../utils/logger";
import { createMfaClient } from "../../utils/mfaClient";
import { MfaMethod } from "../../utils/mfaClient/types";

export async function switchBackupMfaMethodGet(
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
      currentBackupMethod.method.phoneNumber,
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
      currentDefaultMethod.method.phoneNumber,
      4
    );
  }

  res.render("switch-backup-method/index.njk", {
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

export async function switchBackupMfaMethodPost(
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
    const mfaClient = createMfaClient(req, res);
    const response = await mfaClient.makeDefault(
      newDefaultMethod as unknown as MfaMethod
    );

    if (!response.success) {
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
      logger.error(
        "Switch backup method controller: error updating default MFA method",
        response.problem.title
      );
      return;
    }
  } catch (error) {
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    logger.error(
      "Switch backup method controller: error updating default MFA method",
      error.message
    );
    return;
  }

  req.session.user.state.switchBackupMethod = getNextState(
    req.session.user.state.switchBackupMethod.value,
    EventType.ValueUpdated
  );

  req.session.newDefaultMfaMethodId = newDefaultMethod.mfaIdentifier;

  res.redirect(PATH_DATA.SWITCH_BACKUP_METHOD_CONFIRMATION.url);
}
