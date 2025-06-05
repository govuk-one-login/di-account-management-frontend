import { Request, Response, NextFunction } from "express";
import { MFA_METHODS, mfaOplTaxonomies } from "../../app.constants";
import { getNextState } from "../../utils/state-machine";
import { match } from "ts-pattern";

type MfaMethods = keyof typeof MFA_METHODS;
enum MfaMethodType {
  SMS = "SMS",
  AUTH_APP = "AUTH_APP",
}
const MAX_METHODS = 2;
const ADD_METHOD_TEMPLATE = `choose-backup/index.njk`;

function handleMethods(res: Response): void {
  res.status(500).end();
}

const getOplValues = (
  req: Request
):
  | { contentId: string; taxonomyLevel2?: string; taxonomyLevel3?: string }
  | undefined => {
  return match({ req })
    .when(
      ({ req }) =>
        req.session.mfaMethods.find((m) => {
          return (
            m.method.mfaMethodType === "AUTH_APP" &&
            m.priorityIdentifier === "DEFAULT"
          );
        }),

      () => ({
        contentId: "63f44ae6-46f1-46c3-a2e8-305fe2ddf27d",
        ...mfaOplTaxonomies,
      })
    )
    .otherwise((): undefined => undefined);
};

function handleSingleAuthAppMethod(req: Request, res: Response): void {
  res.render(ADD_METHOD_TEMPLATE, {
    mfaMethods: [],
    showSingleMethod: true,
    oplValues: getOplValues(req),
  });
}

function renderChooseBackupTemplate(
  req: Request,
  res: Response,
  mfaMethods: any[]
): void {
  res.render(ADD_METHOD_TEMPLATE, { mfaMethods, oplValues: getOplValues(req) });
}

export function chooseBackupGet(req: Request, res: Response): void {
  const mfaMethods = req.session.mfaMethods || [];

  if (mfaMethods.length > MAX_METHODS) {
    handleMethods(res);
    return;
  }

  if (
    mfaMethods.length === 1 &&
    mfaMethods[0].method.mfaMethodType === MfaMethodType.AUTH_APP
  ) {
    handleSingleAuthAppMethod(req, res);
    return;
  }

  renderChooseBackupTemplate(req, res, mfaMethods);
}

export function chooseBackupPost(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { addBackup } = req.body;

  const method = Object.keys(MFA_METHODS).find((key: MfaMethods) => {
    return MFA_METHODS[key].type === addBackup;
  });

  if (!method) {
    req.log.error(`unknown addBackup: ${addBackup}`);
    return next(new Error(`Unknown addBackup: ${addBackup}`));
  }

  const selectedMfaMethod = MFA_METHODS[method as MfaMethods];
  req.session.user.state.addBackup = getNextState(
    req.session.user.state.addBackup.value,
    selectedMfaMethod.event
  );

  res.redirect(selectedMfaMethod.path.url);
  res.end();
}
