import { Request, Response } from "express";
import {
  getAppEnv,
  activityLogItemsPerPage,
  getOIDCClientId,
  reportSuspiciousActivity,
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
  const backLink = PATH_DATA.SECURITY.url;
  let formattedActivityLog: FormattedActivityLog[] = [];
  const reportSuspiciousActivityFlag = reportSuspiciousActivity();

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

    const securityNoticeHtml = `
    <p class="govuk-body">
      ${req.t("pages.activityHistory.securityNoticeContent1").replace("[changePasswordLink]", PATH_DATA.SECURITY.url)}
    </p>
    <p class="govuk-body">
      ${req.t("pages.activityHistory.securityNoticeContent2").replace("[reportActivityLink]", PATH_DATA.CONTACT.url)}
    </p>`;

    res.render("activity-history/index.njk", {
      data: formattedActivityLog,
      reportSuspiciousActivity: reportSuspiciousActivityFlag,
      securityNoticeHtml,
      env: env,
      pagination: pagination,
      backLink: backLink,
      changePasswordLink: PATH_DATA.SECURITY.url,
      contactLink: PATH_DATA.CONTACT.url,
      homeClientId: getOIDCClientId(),
    });
  } catch (error) {
    logger.error(
      `Activity-history-controller: Error during activity history get ${error}`
    );
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    res.render("common/errors/500.njk");
  }
}
