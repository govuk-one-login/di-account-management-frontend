import { Request, Response } from "express";
import { eventService } from "../../services/event-service";
import { EventName, LogoutState } from "../../app.constants";
import { handleLogout } from "../../utils/logout";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

export function globalLogoutGet(req: Request, res: Response): void {
  res.render("global-logout/index.njk", {});
}

export async function globalLogoutPost(req: Request, res: Response) {
  const service = eventService();
  const auditEvent = service.buildAuditEvent(
    req,
    res,
    EventName.HOME_GLOBAL_LOGOUT_REQUESTED
  );
  service.send(auditEvent, res.locals.trace);
  req.metrics?.addMetric("globalLogoutPost", MetricUnit.Count, 1);
  await handleLogout(req, res, LogoutState.Start);
}
