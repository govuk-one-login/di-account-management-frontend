import { Request, Response, NextFunction } from "express";
import { MFA_METHODS } from "../../app.constants.js";
import { getNextState } from "../../utils/state-machine.js";
import {
  mfaMethodTypes,
  mfaPriorityIdentifiers,
} from "../../utils/mfaClient/types.js";
import {
  MFA_COMMON_OPL_SETTINGS,
  OplSettingsLookupObject,
  setOplSettings,
} from "../../utils/opl.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

type MfaMethods = keyof typeof MFA_METHODS;
enum MfaMethodType {
  SMS = "SMS",
  AUTH_APP = "AUTH_APP",
}
const MAX_METHODS = 2;
const ADD_METHOD_TEMPLATE = `choose-backup/index.njk`;

const OPL_VALUES: OplSettingsLookupObject = {
  [`${mfaPriorityIdentifiers.default}_${mfaMethodTypes.authApp}`]: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "63f44ae6-46f1-46c3-a2e8-305fe2ddf27d",
  },
  [`${mfaPriorityIdentifiers.default}_${mfaMethodTypes.sms}`]: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "d567c2cd-b769-4085-9d7b-bd6094d44050",
  },
};

const setLocalOplSettings = (req: Request, res: Response) => {
  const defaultMfaMethodType = req.session.mfaMethods?.find(
    (method) => method.priorityIdentifier === mfaPriorityIdentifiers.default
  )?.method.mfaMethodType;

  const oplSettings =
    OPL_VALUES[`${mfaPriorityIdentifiers.default}_${defaultMfaMethodType}`];

  setOplSettings(oplSettings, res);
};

function handleMethods(res: Response): void {
  res.status(500).end();
}

function handleSingleAuthAppMethod(res: Response): void {
  res.render(ADD_METHOD_TEMPLATE, {
    mfaMethods: [],
    showSingleMethod: true,
  });
}

function renderChooseBackupTemplate(res: Response, mfaMethods: any[]): void {
  res.render(ADD_METHOD_TEMPLATE, { mfaMethods });
}

export function chooseBackupGet(req: Request, res: Response): void {
  req.metrics?.addMetric("chooseBackupGet", MetricUnit.Count, 1);
  setLocalOplSettings(req, res);

  const mfaMethods = req.session.mfaMethods || [];

  if (mfaMethods.length > MAX_METHODS) {
    handleMethods(res);
    return;
  }

  if (
    mfaMethods.length === 1 &&
    mfaMethods[0].method.mfaMethodType === MfaMethodType.AUTH_APP
  ) {
    handleSingleAuthAppMethod(res);
    return;
  }

  renderChooseBackupTemplate(res, mfaMethods);
}

export function chooseBackupPost(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  req.metrics?.addMetric("chooseBackupPost", MetricUnit.Count, 1);
  setLocalOplSettings(req, res);

  const { addBackup } = req.body;

  const method = Object.keys(MFA_METHODS).find((key: MfaMethods) => {
    return MFA_METHODS[key].type === addBackup;
  });

  if (!method) {
    req.log.error(`unknown addBackup: ${addBackup}`);
    return next(new Error(`Unknown addBackup: ${addBackup}`));
  }

  const selectedMfaMethod = MFA_METHODS[method as MfaMethods];
  req.session.user.state.addBackup = getNextState(
    req.session.user.state.addBackup.value,
    selectedMfaMethod.event
  );

  res.redirect(selectedMfaMethod.path.url);
}
