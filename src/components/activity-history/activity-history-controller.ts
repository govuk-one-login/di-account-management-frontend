import { Request, Response } from "express";
import {
  getAppEnv,
  activityLogItemsPerPage,
  getOIDCClientId,
  reportSuspiciousActivity,
  reportingFormEnabled,
} from "../../config";
import { PATH_DATA, HTTP_STATUS_CODES } from "../../app.constants";
import {
  generatePagination,
  formatActivityLogs,
  filterAndDecryptActivity,
} from "../../utils/activityHistory";
import { presentActivityHistory } from "../../utils/present-activity-history";
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
      logger.error("Activity history controller: user_id missing from session");
    }

    res.render("activity-history/index.njk", {
      data: formattedActivityLog,
      reportSuspiciousActivity: reportSuspiciousActivity(),
      env: env,
      pagination: pagination,
      backLink: PATH_DATA.SECURITY.url,
      changePasswordLink: PATH_DATA.SECURITY.url,
      contactLink: PATH_DATA.AUTH_REPORTING_FORM.url,
      homeClientId: getOIDCClientId(),
      reportingFormEnabled: reportingFormEnabled(),
    });
  } catch (error) {
    logger.error(
      `Activity-history-controller: Error during activity history get ${error}`
    );
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    res.render("common/errors/500.njk");
  }
}
