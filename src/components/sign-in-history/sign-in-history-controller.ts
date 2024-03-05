import { Request, Response } from "express";
import { getAppEnv, activityLogItemsPerPage } from "../../config";
import {
  presentSignInHistory,
  generatePagination,
  formatData,
  hasExplanationParagraph,
  filterAndDecryptActivity,
} from "../../utils/signInHistory";
import { HTTP_STATUS_CODES } from "../../app.constants";
import { ActivityLogEntry, FormattedActivityLog } from "../../utils/types";

export async function signInHistoryGet(
  req: Request,
  res: Response
): Promise<void> {
  const { user } = req.session;
  const env = getAppEnv();
  let activityData: ActivityLogEntry[] = [];
  let showExplanation = false;
  let pagination: any = {};
  let FormattedActivityLog: FormattedActivityLog[] = [];
  let validActivityDataLength = 0;

  try {
    if (user && user.subjectId) {
      const trace = res.locals.sessionId;
      const userId = user.subjectId;
      activityData = await presentSignInHistory(userId, trace);
      const validActivityData: ActivityLogEntry[] =
        await filterAndDecryptActivity(activityData);
      if (validActivityData.length > 0) {
        const pageParameter = req.query?.page;
        validActivityDataLength = validActivityData.length;
        pagination =
          validActivityDataLength > activityLogItemsPerPage
            ? generatePagination(validActivityDataLength, pageParameter)
            : { currentPage: 1 };
        FormattedActivityLog = await formatData(
          validActivityData,
          pagination?.currentPage,
          req.i18n.language
        );
        showExplanation = hasExplanationParagraph(FormattedActivityLog);
      }
    }

    res.render("sign-in-history/index.njk", {
      showExplanation: showExplanation,
      data: FormattedActivityLog,
      env: env,
      pagination: pagination,
    });
  } catch (e) {
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    res.render("common/errors/500.njk");
  }
}
