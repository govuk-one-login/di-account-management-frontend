import { Request, Response } from "express";
import { getAppEnv, activityLogItemsPerPage } from "../../config";
import {
  presentSignInHistory,
  generatePagination,
  formatData,
  hasExplanationParagraph,
} from "../../utils/signInHistory";

export async function signInHistoryGet(
  req: Request,
  res: Response
): Promise<void> {
  const { user } = req.session;
  const env = getAppEnv();
  let activityData: any[] = [];
  let showExplanation = false;
  let data: any = [];
  let pagination: any = {};
  if (user?.subjectId) {
    const trace = res.locals.sessionId;
    activityData = await presentSignInHistory(user.subjectId, trace);
    const pageParameter = req.query?.page;
    const dataLength = activityData.length;
    showExplanation = hasExplanationParagraph(activityData);
    if (dataLength <= activityLogItemsPerPage) {
      data = formatData(activityData);
    } else {
      pagination = generatePagination(dataLength, pageParameter);
      data = formatData(activityData, pagination.currentPage);
    }
  }

  res.render("sign-in-history/index.njk", {
    showExplanation: showExplanation,
    data: data,
    env: env,
    pagination: pagination,
  });
}
