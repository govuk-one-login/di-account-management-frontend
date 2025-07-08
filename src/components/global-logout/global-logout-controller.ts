import { Request, Response } from "express";
import { eventService } from "../../services/event-service";
import { EventName, LogoutState } from "../../app.constants";
import { handleLogout } from "../../utils/logout";

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
  await handleLogout(req, res, LogoutState.Default);
}
