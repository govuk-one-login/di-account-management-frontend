import { Request, Response } from "express";
import { eventService as createEventService } from "../../services/event-service.js";
import { EventName, LogoutState, PATH_DATA } from "../../app.constants.js";
import { handleLogout } from "../../utils/logout.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { setOplSettings } from "../../utils/opl.js";
import {
  UserJourney,
  EventType,
  getNextState,
} from "../../utils/state-machine.js";
import { sqsService as createSqsService } from "../..//utils/sqs.js";
import { DeviceIntelligence } from "../../types.js";

export function globalLogoutGet(req: Request, res: Response): void {
  setOplSettings(
    {
      contentId: "2b095344-f460-4e7c-a7e8-51e882447750",
    },
    res
  );
  res.render("global-logout/index.njk", {});
}

export function globalLogoutPost(req: Request, res: Response) {
  res.redirect(
    `${PATH_DATA.ENTER_PASSWORD.url}?type=${UserJourney.GlobalLogout}`
  );
}

// This GET handler performs a destructive action.
// We need to do this because the screen immediately before this is the
// 'enter your password' screen. The POST handler on that route is already
// large and complicated. It's 'less bad' to leave that handler to just
// perform the redirect back here, than adding a custom branch and behaviour.
export async function globalLogoutConfirmGet(req: Request, res: Response) {
  const eventService = createEventService();
  const auditEvent = eventService.buildAuditEvent(
    req,
    res,
    EventName.HOME_GLOBAL_LOGOUT_REQUESTED
  );
  eventService.send(auditEvent, res.locals.trace);

  const sqsService = createSqsService();
  await sqsService.sendMessage(
    process.env.NOTIFICATION_QUEUE_URL,
    JSON.stringify({
      notificationType: "GLOBAL_LOGOUT",
      emailAddress: req.session.user.email,
      loggedOutAt: new Date().toISOString(),
      ...(() => {
        const txmaAuditEndoded = req.headers["txma-audit-encoded"] as string;
        if (!txmaAuditEndoded) {
          return {};
        }
        const deviceIntelligence = JSON.parse(
          atob(txmaAuditEndoded)
        ) as DeviceIntelligence;

        return {
          ipAddress: deviceIntelligence.ip_address,
          countryCode: deviceIntelligence.country_code,
          userAgent: deviceIntelligence.user_agent,
        };
      })(),
    }),
    res.locals.trace
  );

  req.metrics?.addMetric("globalLogoutPost", MetricUnit.Count, 1);

  req.session.user.state.globalLogout = getNextState(
    req.session.user.state.globalLogout.value,
    EventType.ValueUpdated
  );
  await handleLogout(req, res, LogoutState.Start);
}
