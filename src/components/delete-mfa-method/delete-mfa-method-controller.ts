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
      contentId: "143f63ff-cf73-4911-a024-bf0759ba3a1f",
    },
    res
  );
};

export async function deleteMfaMethodGet(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric("deleteMfaMethodGet", MetricUnit.Count, 1);

  setLocalOplSettings(res);

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
  req.metrics?.addMetric("deleteMfaMethodPost", MetricUnit.Count, 1);
  setLocalOplSettings(res);

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
