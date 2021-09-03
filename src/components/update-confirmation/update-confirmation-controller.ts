import { Request, Response } from "express";

export function updateConfirmationEmailGet(req: Request, res: Response): void {
  res.render("update-confirmation/index.njk", 
  { pageTitle: req.t('pages.updateEmailConfirmation.title'),
    panelText: req.t('pages.updateEmailConfirmation.panelText'),
    summaryText: req.t('pages.updateEmailConfirmation.summaryText') + req.session.user.email
  });
}