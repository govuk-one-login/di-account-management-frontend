import { Request, Response } from "express";
import { EnterPasswordServiceInterface } from "./types";
import { enterPasswordService } from "./enter-password-service";
import { ExpressRouteFunc } from "../../types";
import { PATH_DATA, LogoutState, mfaOplTaxonomies } from "../../app.constants";
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
import { match, P } from "ts-pattern";

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

const getOplValues = (
  req: Request,
  requestType: UserJourney
):
  | { contentId: string; taxonomyLevel2?: string; taxonomyLevel3?: string }
  | undefined => {
  return match({ req, requestType })
    .with({ requestType: UserJourney.ChangeEmail }, () => ({
      contentId: "e00e882b-f54a-40d3-ac84-85737424471c",
      taxonomyLevel2: "change email",
    }))
    .with({ requestType: UserJourney.ChangePassword }, () => ({
      contentId: "23d51dca-51ca-44ad-86e0-b7599ce14412",
      taxonomyLevel2: "change password",
    }))
    .with({ requestType: UserJourney.DeleteAccount }, () => ({
      contentId: "c69af4c7-5496-4c11-9d22-97bd3d2e9349",
      taxonomyLevel2: "delete account",
    }))
    .with({ requestType: UserJourney.ChangePhoneNumber }, () => ({
      contentId: "e1cde140-d7e6-4221-90ca-0f2d131743cd",
      ...mfaOplTaxonomies,
    }))
    .with({ requestType: UserJourney.RemoveBackup }, () => ({
      contentId: "a4bbf434-652c-45de-bdda-c47922b43960",
      ...mfaOplTaxonomies,
    }))
    .with({ requestType: UserJourney.ChangeAuthApp }, () => ({
      contentId: "70ce4972-cde0-4e58-ac9d-8ea1b57775bf",
      ...mfaOplTaxonomies,
    }))
    .with({ requestType: UserJourney.SwitchBackupMethod }, () => ({
      contentId: "acef67be-40e5-4ebf-83d6-b8bc8c414304",
      ...mfaOplTaxonomies,
    }))
    .with(
      {
        requestType: UserJourney.addBackup,
        req: P.when((req) =>
          req.session.mfaMethods.find((m) => {
            return (
              m.method.mfaMethodType === "AUTH_APP" &&
              m.priorityIdentifier === "DEFAULT"
            );
          })
        ),
      },
      () => ({
        contentId: "bf008253-6df5-47ee-8c5a-33dced6bd5a0",
        ...mfaOplTaxonomies,
      })
    )
    .with(
      {
        requestType: UserJourney.ChangeDefaultMethod,
        req: P.when((req) =>
          req.session.mfaMethods.find((m) => {
            return (
              m.method.mfaMethodType === "AUTH_APP" &&
              m.priorityIdentifier === "DEFAULT"
            );
          })
        ),
      },
      () => ({
        contentId: "dab39fa5-b685-4ade-b541-9fa836df9569",
        ...mfaOplTaxonomies,
      })
    )
    .with(
      {
        requestType: UserJourney.ChangeDefaultMethod,
        req: P.when((req) =>
          req.session.mfaMethods.find((m) => {
            return (
              m.method.mfaMethodType === "SMS" &&
              m.priorityIdentifier === "DEFAULT"
            );
          })
        ),
      },
      () => ({
        contentId: "0ee49bab-a3c2-4fc3-b062-b2c5641aec5b",
        ...mfaOplTaxonomies,
      })
    )
    .otherwise((): undefined => undefined);
};

const getRenderOptions = (req: Request, requestType: UserJourney) => {
  const oplValues = getOplValues(req, requestType);

  return {
    requestType,
    fromSecurity: req.query.from == "security",
    oplValues,
    formAction: req.url,
  };
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
