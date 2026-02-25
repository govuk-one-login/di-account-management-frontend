import { Request, Response } from "express";
import { EnterPasswordServiceInterface } from "./types";
import { enterPasswordService } from "./enter-password-service";
import { ExpressRouteFunc } from "../../types";
import { PATH_DATA, LogoutState, EventName } from "../../app.constants";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";
import {
  EventType,
  getInitialState,
  getNextState,
  UserJourney,
} from "../../utils/state-machine";
import { handleLogout } from "../../utils/logout";
import { getRequestConfigFromExpress } from "../../utils/http";
import {
  EMPTY_OPL_SETTING_VALUE,
  MFA_COMMON_OPL_SETTINGS,
  OplSettingsLookupObject,
  CHANGE_EMAIL_COMMON_OPL_SETTINGS,
  CHANGE_PASSWORD_COMMON_OPL_SETTINGS,
  DELETE_ACCOUNT_COMMON_OPL_SETTINGS,
  setOplSettings,
} from "../../utils/opl";
import {
  mfaMethodTypes,
  mfaPriorityIdentifiers,
} from "../../utils/mfaClient/types";
import { eventService } from "../../services/event-service";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

const TEMPLATE = "enter-password/index.njk";

const REDIRECT_PATHS: Record<UserJourney, string> = {
  [UserJourney.ChangeEmail]: PATH_DATA.CHANGE_EMAIL.url,
  [UserJourney.ChangePassword]: PATH_DATA.CHANGE_PASSWORD.url,
  [UserJourney.ChangePhoneNumber]: PATH_DATA.CHANGE_PHONE_NUMBER.url,
  [UserJourney.ChangeAuthApp]: PATH_DATA.CHANGE_AUTHENTICATOR_APP.url,
  [UserJourney.DeleteAccount]: PATH_DATA.DELETE_ACCOUNT.url,
  [UserJourney.addBackup]: PATH_DATA.ADD_MFA_METHOD.url,
  [UserJourney.RemoveBackup]: PATH_DATA.DELETE_MFA_METHOD.url,
  [UserJourney.SwitchBackupMethod]: PATH_DATA.SWITCH_BACKUP_METHOD.url,
  [UserJourney.ChangeDefaultMethod]: PATH_DATA.CHANGE_DEFAULT_METHOD.url,
  [UserJourney.GlobalLogout]: PATH_DATA.GLOBAL_LOGOUT_CONFIRM.url,
};

const getOplValues = (): OplSettingsLookupObject => ({
  [UserJourney.ChangeEmail]: {
    ...CHANGE_EMAIL_COMMON_OPL_SETTINGS,
    contentId: "ce832c9d-a0b8-4949-8215-d70ca285fa46",
  },
  [UserJourney.ChangePassword]: {
    ...CHANGE_PASSWORD_COMMON_OPL_SETTINGS,
    contentId: "0a6233f9-0a40-48c2-b7c1-98916a01f31e",
  },
  [UserJourney.ChangePhoneNumber]: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "e1cde140-d7e6-4221-90ca-0f2d131743cd",
  },
  [UserJourney.DeleteAccount]: {
    ...DELETE_ACCOUNT_COMMON_OPL_SETTINGS,
    contentId: "c37f049b-4144-441a-bc50-e53f02640cf3",
  },
  [`${UserJourney.addBackup}_${mfaPriorityIdentifiers.default}_${mfaMethodTypes.authApp}`]:
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "bf008253-6df5-47ee-8c5a-33dced6bd5a0",
    },
  [`${UserJourney.addBackup}_${mfaPriorityIdentifiers.default}_${mfaMethodTypes.sms}`]:
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "7fa84113-f58c-418f-a3c1-c5297cd05f48",
    },
  [`${UserJourney.ChangeDefaultMethod}_${mfaPriorityIdentifiers.default}_${mfaMethodTypes.authApp}`]:
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "dab39fa5-b685-4ade-b541-9fa836df9569",
    },
  [`${UserJourney.ChangeDefaultMethod}_${mfaPriorityIdentifiers.default}_${mfaMethodTypes.sms}`]:
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "0ee49bab-a3c2-4fc3-b062-b2c5641aec5b",
    },
  [UserJourney.RemoveBackup]: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "a4bbf434-652c-45de-bdda-c47922b43960",
  },
  [UserJourney.ChangeAuthApp]: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "70ce4972-cde0-4e58-ac9d-8ea1b57775bf",
  },
  [UserJourney.SwitchBackupMethod]: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "acef67be-40e5-4ebf-83d6-b8bc8c414304",
  },
  [UserJourney.GlobalLogout]: {
    contentId: "cefa908b-d774-4da4-b8df-3d4bc6ec3323",
  },
});

const getRenderOptions = (req: Request, requestType: UserJourney) => {
  return {
    requestType,
    fromSecurity: req.query.from == "security",
    formAction: req.url,
  };
};

const setLocalOplSettings = (
  req: Request,
  res: Response,
  requestType: UserJourney
) => {
  const defaultMfaMethodType = req.session.mfaMethods?.find(
    (method) => method.priorityIdentifier === mfaPriorityIdentifiers.default
  )?.method.mfaMethodType;

  const OPL_VALUES = getOplValues();

  setOplSettings(
    OPL_VALUES[
      `${requestType}_${mfaPriorityIdentifiers.default}_${defaultMfaMethodType}`
    ] ??
      OPL_VALUES[requestType] ?? {
        contentId: EMPTY_OPL_SETTING_VALUE,
        taxonomyLevel2: EMPTY_OPL_SETTING_VALUE,
      },
    res
  );
};

function renderPasswordError(
  req: Request,
  res: Response,
  requestType: UserJourney,
  errorMsgKey: string
) {
  const error = formatValidationError("password", req.t(errorMsgKey));

  renderBadRequest(
    res,
    req,
    TEMPLATE,
    error,
    getRenderOptions(req, requestType)
  );
}

async function sendJourneyAuditEvent(
  req: Request,
  res: Response,
  requestType: UserJourney
): Promise<void> {
  let eventName: EventName;

  switch (requestType) {
    case UserJourney.addBackup:
      eventName = EventName.AUTH_MFA_METHOD_ADD_STARTED;
      break;
    case UserJourney.SwitchBackupMethod:
      eventName = EventName.AUTH_MFA_METHOD_SWITCH_STARTED;
      break;
    case UserJourney.RemoveBackup:
      eventName = EventName.AUTH_MFA_METHOD_DELETE_STARTED;
      break;
  }

  if (eventName) {
    const service = eventService();
    const auditEvent = service.buildAuditEvent(req, res, eventName);
    service.send(auditEvent, res.locals.trace);
  }
}

export async function enterPasswordGet(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric("enterPasswordGet", MetricUnit.Count, 1);
  const requestType = req.query.type as UserJourney;

  setLocalOplSettings(req, res, requestType);

  if (!requestType) {
    res.redirect(PATH_DATA.SECURITY.url);
    return;
  }
  req.session.user.state[requestType] = getInitialState();

  await sendJourneyAuditEvent(req, res, requestType);
  res.render(TEMPLATE, getRenderOptions(req, requestType));
}

export function enterPasswordPost(
  service: EnterPasswordServiceInterface = enterPasswordService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    req.metrics?.addMetric("enterPasswordPost", MetricUnit.Count, 1);
    const requestType = req.query.type as UserJourney;

    setLocalOplSettings(req, res, requestType);

    if (!requestType) {
      return res.redirect(PATH_DATA.SECURITY.url);
    }

    const { password } = req.body;

    if (!password) {
      renderPasswordError(
        req,
        res,
        requestType,
        "pages.enterPassword.password.validationError.required"
      );
      return;
    }

    const response = await service.authenticated(
      req.session.user.email,
      password,
      await getRequestConfigFromExpress(req, res)
    );

    if (response.authenticated) {
      req.session.user.state[requestType] = getNextState(
        req.session.user.state[requestType].value,
        EventType.Authenticated
      );
      const redirectPath = getRenderOptions(req, requestType).fromSecurity
        ? `${REDIRECT_PATHS[requestType]}?from=security`
        : REDIRECT_PATHS[requestType];
      res.redirect(redirectPath);
      return;
    }

    if (response.intervention) {
      await handleIntervention(response.intervention, req, res, requestType);
      return;
    }

    renderPasswordError(
      req,
      res,
      requestType,
      "pages.enterPassword.password.validationError.incorrectPassword"
    );
  };
}

async function handleIntervention(
  intervention: string,
  req: Request,
  res: Response,
  requestType: UserJourney
): Promise<void> {
  switch (intervention) {
    case "BLOCKED":
      await handleLogout(req, res, LogoutState.Blocked);
      break;
    case "SUSPENDED":
      await handleLogout(req, res, LogoutState.Suspended);
      break;
    default:
      renderPasswordError(
        req,
        res,
        requestType,
        "pages.enterPassword.password.validationError.incorrectPassword"
      );
  }
}
