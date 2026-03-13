import { Request, Response } from "express";

import {
  getRequestConfig,
  getRequestConfigFromExpress,
} from "../../utils/http.js";
import {
  validateQueryParams,
  exchangeCodeForToken,
  isValidTokenResponse,
  getJourneyOutcomeResponse,
  handleJourneyOutcomeResponse,
  ValidQueryStringParams,
} from "./amc-callback-utils.js";

export async function amcCallbackGet(
  req: Request,
  res: Response
): Promise<void> {
  const { code, error, error_description } =
    req.query as ValidQueryStringParams;
  const userState = req.session.user.state.journey;
  const expressConfig = await getRequestConfigFromExpress(req, res);
  const requestConfig = getRequestConfig({ ...expressConfig });

  try {
    validateQueryParams(req.query, userState);
  } catch (error) {
    req.log.error(error.message);
    res.redirect("/handle-invalid-query-params");
    return;
  }

  delete req.session.user.state.journey;

  if (error || error_description) {
    req.log.error(`amcCallbackGet: ${error} - ${error_description}`);
    res.redirect("/todo-redirect-on-err");
    return;
  }

  if (typeof code === "string") {
    const tokenResponse = await exchangeCodeForToken(code, requestConfig);

    if (isValidTokenResponse(tokenResponse)) {
      const journeyOutcomeResponse = await getJourneyOutcomeResponse(
        tokenResponse.access_token,
        requestConfig
      );
      try {
        await handleJourneyOutcomeResponse(req, res, journeyOutcomeResponse);
      } catch (err) {
        throw new Error(
          `Failed to handle journey outcome response with ${err}`
        );
      }
    } else {
      throw new Error("Response did not match expected TokenResponse");
    }
  }
}
