import { Request, Response } from "express";
import { getAppEnv, activityLogItemsPerPage } from "../../config";
import { presentSignInHistory, generatePagination, formatData, hasAccountCreationEvent } from "../../utils/signInHistory";


export async function signInHistoryGet(
  req: Request,
  res: Response
): Promise<void> {
  const { user } = req.session;
  const env = getAppEnv();
  let activityData:any[] = [];
  let isNewUser = false;
  let data:any = [];
  let pagination:any = {};
  if (user && user.subjectId) {
    activityData = await presentSignInHistory();
    const pageParameter = req.query?.page
    const dataLength = activityData.length;
    isNewUser = hasAccountCreationEvent(activityData)
    if (dataLength <= activityLogItemsPerPage) {
      data = formatData(activityData);
    } else {
      pagination = generatePagination(dataLength, pageParameter)
      data = formatData(activityData, pagination.currentPage)
    }
  } 

  res.render("sign-in-history/index.njk", { 
    isNewUser: isNewUser,
    data: data, 
    env: env, 
    pagination: pagination
  });
}
