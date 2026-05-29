import { Request, Response } from "express";
import { HTTP_STATUS_CODES, EventName } from "../../app.constants.js";
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
import {
  EventType,
  getNextState,
  UserJourney,
} from "../../utils/state-machine.js";
import { eventService } from "../../services/event-service.js";

export async function amcCallbackGet(
  req: Request,
  res: Response
): Promise<void> {
  const { code, error, error_description, scope } =
    req.query as ValidQueryStringParams;
  const { amcStates } = req.session;
  const expressConfig = await getRequestConfigFromExpress(req, res);
  const requestConfig = getRequestConfig({ ...expressConfig });
  const service = eventService();

  try {
    validateQueryParams(req.query, amcStates);
  } catch (error) {
    req.log.error(error.message);
    res.status(HTTP_STATUS_CODES.BAD_REQUEST);
    res.render("common/errors/500.njk");
    return;
  }

  if (error || error_description) {
    req.log.error(`amcCallbackGet: ${error} - ${error_description}`);
    res.status(HTTP_STATUS_CODES.BAD_REQUEST);
    const auditEvent = service.buildAuditEvent(
      req,
      res,
      EventName.HOME_AMC_AUTHORISATION_ERROR_RECEIVED,
      {
        amc_scope: scope,
      }
    );
    service.send(auditEvent, res.locals.trace);

    res.render("common/errors/500.njk");
    return;
  }

  if (typeof code === "string") {
    const tokenResponse = await exchangeCodeForToken(
      code,
      req.query.scope,
      requestConfig
    );

    if (isValidTokenResponse(tokenResponse)) {
      const journeyOutcomeResponse = await getJourneyOutcomeResponse(
        tokenResponse.access_token,
        requestConfig
      );

      if (journeyOutcomeResponse.scope !== req.query.scope) {
        throw new Error(
          "The scope in the journey outcome does not match the scope from the query parameters"
        );
      }

      const journeyType = UserJourney.CreatePasskey;
      req.session.user.state[journeyType] = getNextState(
        req.session.user.state[journeyType].value,
        EventType.ValueUpdated
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
