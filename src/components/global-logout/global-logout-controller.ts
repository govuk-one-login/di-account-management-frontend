import { Request, Response } from "express";
import { eventService } from "../../services/event-service";
import { EventName, LogoutState, PATH_DATA } from "../../app.constants";
import { handleLogout } from "../../utils/logout";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { setOplSettings } from "../../utils/opl";
import {
  UserJourney,
  EventType,
  getNextState,
} from "../../utils/state-machine";

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

export async function globalLogoutConfirmGet(req: Request, res: Response) {
  const service = eventService();
  const auditEvent = service.buildAuditEvent(
    req,
    res,
    EventName.HOME_GLOBAL_LOGOUT_REQUESTED
  );
  service.send(auditEvent, res.locals.trace);
  req.metrics?.addMetric("globalLogoutPost", MetricUnit.Count, 1);
  req.session.user.state.globalLogout = getNextState(
    req.session.user.state.globalLogout.value,
    EventType.ValueUpdated
  );
  await handleLogout(req, res, LogoutState.Start);
}
