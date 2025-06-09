import { Request, Response } from "express";
import { EnterPasswordServiceInterface } from "./types";
import { enterPasswordService } from "./enter-password-service";
import { ExpressRouteFunc } from "../../types";
import { PATH_DATA, LogoutState } from "../../app.constants";
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
import {
  supportChangeOnIntervention,
  supportMfaManagement,
} from "../../config";
import { handleLogout } from "../../utils/logout";
import { getRequestConfigFromExpress } from "../../utils/http";
import {
  EMPTY_OPL_SETTING_VALUE,
  MFA_COMMON_OPL_SETTINGS,
  OplSettings,
  setOplSettings,
} from "../../utils/opl";
import {
  mfaMethodTypes,
  mfaPriorityIdentifiers,
} from "../../utils/mfaClient/types";

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
};

const OPL_VALUES = ((): Record<string, Partial<OplSettings>> => ({
  [UserJourney.ChangeEmail]: {
    contentId: "e00e882b-f54a-40d3-ac84-85737424471c",
    taxonomyLevel2: "change email",
  },
  [UserJourney.ChangePassword]: {
    contentId: "23d51dca-51ca-44ad-86e0-b7599ce14412",
    taxonomyLevel2: "change password",
  },
  [UserJourney.ChangePhoneNumber]: supportMfaManagement()
    ? {
        ...MFA_COMMON_OPL_SETTINGS,
        contentId: "e1cde140-d7e6-4221-90ca-0f2d131743cd",
      }
    : {
        contentId: "2f5f174d-c650-4b28-96cf-365f4fb17af1",
        taxonomyLevel2: "change phone number",
      },
  [UserJourney.DeleteAccount]: {
    contentId: "c69af4c7-5496-4c11-9d22-97bd3d2e9349",
    taxonomyLevel2: "delete account",
  },
  [`${UserJourney.addBackup}_${mfaPriorityIdentifiers.default}_${mfaMethodTypes.authApp}`]:
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "bf008253-6df5-47ee-8c5a-33dced6bd5a0",
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
}))();

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

export function enterPasswordGet(req: Request, res: Response): void {
  const requestType = req.query.type as UserJourney;

  setLocalOplSettings(req, res, requestType);

  if (!requestType) {
    res.redirect(PATH_DATA.SETTINGS.url);
    return;
  }
  req.session.user.state[requestType] = getInitialState();

  res.render(TEMPLATE, getRenderOptions(req, requestType));
}

export function enterPasswordPost(
  service: EnterPasswordServiceInterface = enterPasswordService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const requestType = req.query.type as UserJourney;

    setLocalOplSettings(req, res, requestType);

    if (!requestType) {
      return res.redirect(PATH_DATA.SETTINGS.url);
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
      getRequestConfigFromExpress(req, res)
    );

    if (response.authenticated) {
      req.session.user.state[requestType] = getNextState(
        req.session.user.state[requestType].value,
        EventType.Authenticated
      );
      res.redirect(REDIRECT_PATHS[requestType]);
      return;
    }

    if (supportChangeOnIntervention() && response.intervention) {
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
