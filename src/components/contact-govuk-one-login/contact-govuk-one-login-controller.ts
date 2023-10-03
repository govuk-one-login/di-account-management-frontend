import { Request, Response } from "express";
import {
  supportWebchatContact,
  supportPhoneContact,
} from "../../config";

export function contactGet(req: Request, res: Response): void {
  const data = {
    contactWebchatEnabled: supportWebchatContact(),
    contactPhoneEnabled: supportPhoneContact(),
  };

  res.render("contact-govuk-one-login/index.njk", data);
}
