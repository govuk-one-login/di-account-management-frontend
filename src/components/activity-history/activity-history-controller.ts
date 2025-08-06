import { Request, Response } from "express";
import {
  getAppEnv,
  activityLogItemsPerPage,
  getOIDCClientId,
  reportSuspiciousActivity,
} from "../../config";
import {
  PATH_DATA,
  HTTP_STATUS_CODES,
  EXTERNAL_URLS,
} from "../../app.constants";

import {
  generatePagination,
  formatActivityLogs,
  filterAndDecryptActivity,
} from "../../utils/activityHistory";
import { serviceIsAvailableInWelsh } from "../../utils/yourServices";
import { presentActivityHistory } from "../../utils/present-activity-history";
import { logger } from "../../utils/logger";
import { ActivityLogEntry, FormattedActivityLog } from "../../utils/types";
import { setOplSettings } from "../../utils/opl";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

export async function activityHistoryGet(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric("activityHistoryGet", MetricUnit.Count, 1);
  const { user } = req.session;
  const env = getAppEnv();
  let activityData: ActivityLogEntry[] = [];
  let pagination: any = {};
  let formattedActivityLog: FormattedActivityLog[] = [];
  let hasEnglishOnlyServices;

  try {
    if (user?.subjectId) {
      const trace = res.locals.sessionId;
      activityData = await presentActivityHistory(user.subjectId, trace);
      const pageParameter = req.query?.page;

      const validActivityData: ActivityLogEntry[] =
        await filterAndDecryptActivity(activityData, res.locals.trace);

      hasEnglishOnlyServices = validActivityData.some(
        (item) => serviceIsAvailableInWelsh(item.client_id) === false
      );
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

    setOplSettings(
      {
        contentId: "d61e09c3-5741-4cb9-aca6-d57f62fc3475",
      },
      res
    );

    res.render("activity-history/index.njk", {
      data: formattedActivityLog,
      reportSuspiciousActivity: reportSuspiciousActivity(),
      env: env,
      pagination: pagination,
      backLink: PATH_DATA.SECURITY.url,
      changePasswordLink: PATH_DATA.SECURITY.url,
      contactLink: EXTERNAL_URLS.AUTH_REPORTING_FORM,
      homeClientId: getOIDCClientId(),
      currentLngWelsh: req.i18n?.language === "cy",
      hasEnglishOnlyServices,
    });
  } catch (error) {
    req.metrics?.addMetric("activityHistoryGetError", MetricUnit.Count, 1);
    logger.error(
      `Activity-history-controller: Error during activity history get ${error}`
    );
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    res.render("common/errors/500.njk");
  }
}
