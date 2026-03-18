import { Request, Response } from "express";
import { HTTP_STATUS_CODES } from "../../app.constants.js";
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
  const { amcStates } = req.session;
  const expressConfig = await getRequestConfigFromExpress(req, res);
  const requestConfig = getRequestConfig({ ...expressConfig });

  try {
    validateQueryParams(req.query, amcStates);
  } catch (error) {
    req.log.error(error.message);
    res.status(HTTP_STATUS_CODES.BAD_REQUEST);
    res.render("common/errors/500.njk");
    return;
  }

  req.session.amcStates = amcStates.filter((item) => item !== req.query.state);

  if (error || error_description) {
    req.log.error(`amcCallbackGet: ${error} - ${error_description}`);
    res.status(HTTP_STATUS_CODES.BAD_REQUEST);
    res.render("common/errors/500.njk");
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
