import { Request, Response } from "express";
import { EventName, JourneyAction, PATH_DATA } from "../../app.constants.js";
import {
  createMfaClient,
  formatErrorMessage,
} from "../../utils/mfaClient/index.js";
import { formatPasskeysForRender } from "../../utils/passkeys/index.js";
import { getLastNDigits } from "../../utils/phone-number.js";
import { EventType, getNextState } from "../../utils/state-machine.js";
import {
  PASSKEYS_COMMON_OPL_SETTINGS,
  setOplSettings,
} from "../../utils/opl.js";
import { eventService as createEventService } from "../../services/event-service.js";

export async function removePasskeyGet(
  req: Request,
  res: Response
): Promise<void> {
  const mfaClient = await createMfaClient(req, res);
  const passkeys = await mfaClient.getPasskeys();

  const passkey = passkeys.data.passkeys.find((p) => p.id === req.query.id);

  if (!passkey) {
    res.status(404);
    return;
  }

  const formattedPasskey = (await formatPasskeysForRender(req, [passkey]))[0];

  const hasAlternativePasskey = passkeys.data.passkeys.length > 1;
  const defaultMfaMethod = req.session.mfaMethods.find(
    (method) => method.priorityIdentifier === "DEFAULT"
  );

  setOplSettings(
    {
      ...PASSKEYS_COMMON_OPL_SETTINGS,
      contentId: "b75a90f1-0f70-4908-8661-fc89fb64c67d",
    },
    res
  );

  res.render("remove-passkey/index.njk", {
    passkey: formattedPasskey,
    hasAlternativePasskey,
    defaultMfaType: defaultMfaMethod?.method?.mfaMethodType,
    phoneNumber:
      defaultMfaMethod?.method?.mfaMethodType === "SMS"
        ? getLastNDigits(defaultMfaMethod.method.phoneNumber, 4)
        : null,
  });
}

function sendDeleteFailedAuditEvents(
  req: Request,
  res: Response,
  eventService: ReturnType<typeof createEventService>,
  errorMessage: string
): void {
  eventService.send(
    eventService.buildAuditEvent(req, res, EventName.HOME_PASSKEY_DELETE_FAILED),
    res.locals.trace
  );
  eventService.send(
    eventService.buildAuditEvent(req, res, EventName.HOME_ACTION_COMPLETED, {
      account_action: JourneyAction.PASSKEY_REMOVE,
      account_action_overall_success: false,
      account_action_error: errorMessage,
    }),
    res.locals.trace
  );
}

export async function removePasskeyPost(
  req: Request,
  res: Response
): Promise<void> {
  const mfaClient = await createMfaClient(req, res);
  const eventService = createEventService();

  let response;
  try {
    response = await mfaClient.deletePasskey(req.body.passkeyId);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error deleting passkey";
    req.log.error({ trace: res.locals.trace }, errorMessage);
    sendDeleteFailedAuditEvents(req, res, eventService, errorMessage);
    throw error;
  }

  if (response.success) {
    eventService.send(
      eventService.buildAuditEvent(req, res, EventName.HOME_PASSKEY_DELETE_SUCCESSFUL),
      res.locals.trace
    );

    req.session.user.state.removePasskey = getNextState(
      req.session.user.state.removePasskey.value,
      EventType.RemovePasskey
    );

    eventService.send(
      eventService.buildAuditEvent(req, res, EventName.HOME_ACTION_COMPLETED, {
        account_action: JourneyAction.PASSKEY_REMOVE,
        account_action_overall_success: true,
      }),
      res.locals.trace
    );

    res.redirect(PATH_DATA.PASSKEY_REMOVED_CONFIRMATION.url);
  } else {
    const errorMessage = response.error?.message || "Failed delete passkey";
    req.log.error(
      { trace: res.locals.trace },
      formatErrorMessage("Failed delete passkey", response)
    );
    sendDeleteFailedAuditEvents(req, res, eventService, errorMessage);
    throw new Error(errorMessage);
  }
}
