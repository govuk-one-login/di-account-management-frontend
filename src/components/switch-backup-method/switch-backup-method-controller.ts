import { Request, Response } from "express";
import { HTTP_STATUS_CODES, PATH_DATA } from "../../app.constants";
import { getLastNDigits } from "../../utils/phone-number";
import { EventType, getNextState } from "../../utils/state-machine";
import { createMfaClient, formatErrorMessage } from "../../utils/mfaClient";
import { MFA_COMMON_OPL_SETTINGS, setOplSettings } from "../../utils/opl";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

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
  req.metrics?.addMetric("switchBackupMfaMethodGet", MetricUnit.Count, 1);
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

export async function switchBackupMfaMethodPost(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric("switchBackupMfaMethodPost", MetricUnit.Count, 1);
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
    const mfaClient = await createMfaClient(req, res);
    const response = await mfaClient.makeDefault(
      newDefaultMethod.mfaIdentifier
    );

    if (!response.success) {
      throw new Error(
        formatErrorMessage(
          "Switch backup method controller: error updating default MFA method",
          response
        )
      );
    }
  } catch (error) {
    req.metrics?.addMetric(
      "switchBackupMfaMethodPostError",
      MetricUnit.Count,
      1
    );
    throw error;
  }

  req.session.user.state.switchBackupMethod = getNextState(
    req.session.user.state.switchBackupMethod.value,
    EventType.ValueUpdated
  );

  req.session.newDefaultMfaMethodId = newDefaultMethod.mfaIdentifier;

  res.redirect(PATH_DATA.SWITCH_BACKUP_METHOD_CONFIRMATION.url);
}
