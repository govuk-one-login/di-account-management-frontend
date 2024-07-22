import { Request, Response } from "express";
import { HTTP_STATUS_CODES } from "../../app.constants";
import { getLastNDigits } from "../../utils/phone-number";

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
): Promise<void> {}
