import { Request, Response } from "express";
import {
  supportWebchatContact,
  supportPhoneContact,
  showContactGuidance,
} from "../../config";

export function contactGet(req: Request, res: Response): void {
  const isAuthenticated = req.session?.user?.isAuthenticated;
  let isLoggedOut = req.cookies?.lo;

  if (typeof(isLoggedOut) === 'string') {
    isLoggedOut = JSON.parse(isLoggedOut)
  }

  const data = {
    contactWebchatEnabled: supportWebchatContact(),
    contactPhoneEnabled: supportPhoneContact(),
    showContactGuidance: showContactGuidance(),
    showSignOut: isAuthenticated && !isLoggedOut
  };
  
  res.render("contact-govuk-one-login/index.njk", data);
}
