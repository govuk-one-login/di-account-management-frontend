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
import { supportChangeOnIntervention } from "../../config";
import { handleLogout } from "../../utils/logout";
import { getRequestConfigFromExpress } from "../../utils/http";
import { EMPTY_OPL_SETTING_VALUE, setOplSettings } from "../../utils/opl";

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

const OPL_VALUES: Record<
  UserJourney,
  { contentId: string; taxonomyLevel2: string }
> = {
  [UserJourney.ChangeEmail]: {
    contentId: "e00e882b-f54a-40d3-ac84-85737424471c",
    taxonomyLevel2: "change email",
  },
  [UserJourney.ChangePassword]: {
    contentId: "23d51dca-51ca-44ad-86e0-b7599ce14412",
    taxonomyLevel2: "change password",
  },
  [UserJourney.ChangePhoneNumber]: {
    contentId: "2f5f174d-c650-4b28-96cf-365f4fb17af1",
    taxonomyLevel2: "change phone number",
  },
  [UserJourney.DeleteAccount]: {
    contentId: "c69af4c7-5496-4c11-9d22-97bd3d2e9349",
    taxonomyLevel2: "delete account",
  },
  [UserJourney.addBackup]: {
    contentId: "375aa101-7bd6-43c2-ac39-19c864b49882",
    taxonomyLevel2: "add mfa method",
  },
  [UserJourney.RemoveBackup]: {
    contentId: "375aa101-7bd6-43c2-ac39-19c864b49844",
    taxonomyLevel2: "remove backup mfa",
  },
  [UserJourney.ChangeAuthApp]: {
    contentId: "9f21527b-59ec-4de3-99e7-babd5846e8de",
    taxonomyLevel2: "change auth app",
  },
  [UserJourney.SwitchBackupMethod]: {
    contentId: "313fb160-5961-4f53-b3b9-72d2f961cc2d",
    taxonomyLevel2: "switch backup method",
  },
  [UserJourney.ChangeDefaultMethod]: {
    contentId: "244e4f6f-23bb-489b-9e08-3fb8a44734db",
    taxonomyLevel2: "change default method",
  },
};

const getRenderOptions = (req: Request, requestType: UserJourney) => {
  return {
    requestType,
    fromSecurity: req.query.from == "security",
    formAction: req.url,
  };
};

const setLocalOplSettings = (res: Response, requestType: UserJourney) => {
  setOplSettings(
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

  setLocalOplSettings(res, requestType);
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
  if (!requestType) {
    res.redirect(PATH_DATA.SETTINGS.url);
    return;
  }
  req.session.user.state[requestType] = getInitialState();

  setLocalOplSettings(res, requestType);

  res.render(TEMPLATE, getRenderOptions(req, requestType));
}

export function enterPasswordPost(
  service: EnterPasswordServiceInterface = enterPasswordService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const requestType = req.query.type as UserJourney;

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
