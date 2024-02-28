import { Request, Response } from "express";
import { getAppEnv, activityLogItemsPerPage } from "../../config";
import { PATH_DATA } from "../../app.constants";
import {
  presentActivityHistory,
  generatePagination,
  formatData,
} from "../../utils/activityHistory";
import { logger } from "../../utils/logger";

export async function activityHistoryGet(
  req: Request,
  res: Response
): Promise<void> {
  const { user } = req.session;
  const env = getAppEnv();
  let activityData: any[] = [];
  let data: any = [];
  let pagination: any = {};
  const backLink = PATH_DATA.SECURITY.url;

  if (user?.subjectId) {
    const trace = res.locals.sessionId;
    activityData = await presentActivityHistory(user.subjectId, trace);

    const pageParameter = req.query?.page;
    const dataLength = activityData.length;

    if (dataLength <= activityLogItemsPerPage) {
      data = formatData(activityData);
    } else {
      pagination = generatePagination(dataLength, pageParameter);
      data = formatData(activityData, pagination.currentPage);
    }
  } else {
    logger.error("user_id missing from session");
  }

  res.render("activity-history/index.njk", {
    data: data,
    env: env,
    pagination: pagination,
    backLink: backLink,
    changePasswordLink: PATH_DATA.CHANGE_PASSWORD.url,
  });
}
