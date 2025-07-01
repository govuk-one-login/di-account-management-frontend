import { Request, Response } from "express";
import { EventName, HTTP_STATUS_CODES, PATH_DATA } from "../../app.constants";
import { getLastNDigits } from "../../utils/phone-number";
import { EventType, getNextState } from "../../utils/state-machine";
import { logger } from "../../utils/logger";
import { createMfaClient, formatErrorMessage } from "../../utils/mfaClient";
import { MFA_COMMON_OPL_SETTINGS, setOplSettings } from "../../utils/opl";
import { eventService } from "../../services/event-service";

const setLocalOplSettings = (res: Response) => {
  setOplSettings(
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "86d46095-c39b-490e-82fe-354f74bd2f7c",
    },
    res
  );
};

export async function switchBackupMfaMethodGet(
  req: Request,
  res: Response
): Promise<void> {
  setLocalOplSettings(res);

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

async function sendAuditEvent(req: Request, res: Response): Promise<void> {
  const service = eventService();

  const auditEvent = service.buildAuditEvent(
    req,
    res,
    EventName.AUTH_MFA_METHOD_SWITCH_COMPLETED
  );
  service.send(auditEvent, res.locals.trace);
}

export async function switchBackupMfaMethodPost(
  req: Request,
  res: Response
): Promise<void> {
  setLocalOplSettings(res);

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
      newDefaultMethod.mfaIdentifier
    );

    if (!response.success) {
      res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
      logger.error(
        formatErrorMessage(
          "Switch backup method controller: error updating default MFA method",
          response
        )
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

  await sendAuditEvent(req, res);

  res.redirect(PATH_DATA.SWITCH_BACKUP_METHOD_CONFIRMATION.url);
}
