import { Request, Response } from "express";
import { getAppEnv, activityLogItemsPerPage, getNodeEnv } from "../../config";
import {
  presentSignInHistory,
  generatePagination,
  formatData,
  hasExplanationParagraph,
} from "../../utils/signInHistory";
import { ENVIRONMENT_NAME } from "../../app.constants";

export async function signInHistoryGet(
  req: Request,
  res: Response
): Promise<void> {
  const { user_id } = req.session;
  const env = getAppEnv();
  let activityData: any[] = [];
  let showExplanation = false;
  let pagination: any = {};
  let data: any = [];

  if (user_id) {
    const trace = res.locals.sessionId;
    // localstack uses hardcoded user_id string
    const userId = getNodeEnv() !== ENVIRONMENT_NAME.DEV ? user_id : "user_id";
    activityData = await presentSignInHistory(userId, trace);

    if (activityData.length > 0) {
      const pageParameter = req.query?.page;
      showExplanation = hasExplanationParagraph(activityData);
      pagination =
        activityData.length > activityLogItemsPerPage
          ? generatePagination(activityData.length, pageParameter)
          : { currentPage: 1 };
      data = await formatData(activityData, pagination?.currentPage);
    }
  }

  res.render("sign-in-history/index.njk", {
    showExplanation: showExplanation,
    data: data,
    env: env,
    pagination: pagination,
  });
}
