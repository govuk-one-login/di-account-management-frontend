import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants.js";
import { EventName } from "../../app.constants.js";
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

export async function removePasskeyPost(
  req: Request,
  res: Response
): Promise<void> {
  const mfaClient = await createMfaClient(req, res);
  const response = await mfaClient.deletePasskey(req.body.passkeyId);
  const eventService = createEventService();

  if (response.success) {
    eventService.send(
      eventService.buildAuditEvent(
        req,
        res,
        EventName.HOME_PASSKEY_DELETE_SUCCESSFUL
      ),
      res.locals.trace
    );

    req.session.user.state.removePasskey = getNextState(
      req.session.user.state.removePasskey.value,
      EventType.RemovePasskey
    );

    res.redirect(PATH_DATA.PASSKEY_REMOVED_CONFIRMATION.url);
  } else if (response.error) {
    eventService.send(
      eventService.buildAuditEvent(
        req,
        res,
        EventName.HOME_PASSKEY_DELETE_FAILED
      ),
      res.locals.trace
    );

    req.log.error(
      { trace: res.locals.trace },
      formatErrorMessage("Failed delete passkey", response)
    );
    throw new Error(response.error.message);
  } else {
    eventService.send(
      eventService.buildAuditEvent(
        req,
        res,
        EventName.HOME_PASSKEY_DELETE_FAILED
      ),
      res.locals.trace
    );

    req.log.error({ trace: res.locals.trace }, "Failed delete passkey");
    throw new Error("Error deleting passkey");
  }
}
