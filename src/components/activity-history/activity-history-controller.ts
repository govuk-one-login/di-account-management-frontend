import { Request, Response } from "express";
import { getAppEnv, activityLogItemsPerPage } from "../../config";
import { PATH_DATA } from "../../app.constants";
import {
  presentActivityHistory,
  generatePagination,
  formatActivityLogs,
  filterAndDecryptActivity,
} from "../../utils/activityHistory";
import { HTTP_STATUS_CODES } from "../../app.constants";
import { logger } from "../../utils/logger";
import { ActivityLogEntry, FormattedActivityLog } from "../../utils/types";

export async function activityHistoryGet(
  req: Request,
  res: Response
): Promise<void> {
  const { user } = req.session;
  const env = getAppEnv();
  let activityData: ActivityLogEntry[] = [];
  let pagination: any = {};
  const backLink = PATH_DATA.SECURITY.url;
  let formattedActivityLog: FormattedActivityLog[] = [];

  try {
    if (user?.subjectId) {
      const trace = res.locals.sessionId;
      activityData = await presentActivityHistory(user.subjectId, trace);
      const pageParameter = req.query?.page;

      const validActivityData: ActivityLogEntry[] =
        await filterAndDecryptActivity(activityData, res.locals.trace);

      if (validActivityData.length <= activityLogItemsPerPage) {
        formattedActivityLog = formatActivityLogs(
          validActivityData,
          res.locals.trace,
          undefined,
          req.i18n?.language
        );
      } else {
        pagination = generatePagination(
          validActivityData.length,
          pageParameter
        );
        formattedActivityLog = formatActivityLogs(
          validActivityData,
          res.locals.trace,
          pagination.currentPage,
          req.i18n?.language
        );
      }
    } else {
      logger.error("user_id missing from session");
    }

    res.render("activity-history/index.njk", {
      data: formattedActivityLog,
      env: env,
      pagination: pagination,
      backLink: backLink,
      changePasswordLink: PATH_DATA.SECURITY.url,
      contactLink: PATH_DATA.CONTACT.url
    });
  } catch (e) {
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    res.render("common/errors/500.njk");
  }
}
