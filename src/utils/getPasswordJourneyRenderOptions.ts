import {
  AMJourneyValidBackRouteKey,
  AMJourneyValidBackRoutes,
} from "../types.js";
import { Request } from "express";
import { UserJourney } from "../utils/state-machine.js";
import { convertPageQueryStringToNumber } from "./convertPageQueryStringToNumber.js";

export const getPasswordJourneyRenderOptions = (
  req: Request,
  requestType?: UserJourney
) => {
  let fromDetails;
  const from: AMJourneyValidBackRouteKey | undefined =
    typeof req.query.from === "string" &&
    req.query.from in AMJourneyValidBackRoutes
      ? (req.query.from as AMJourneyValidBackRouteKey)
      : undefined;
  const page =
    from !== undefined && typeof req.query.page === "string"
      ? (convertPageQueryStringToNumber(req.query.page) ?? undefined)
      : undefined;

  if (from) {
    fromDetails = { ...AMJourneyValidBackRoutes[from] };

    if (page) {
      const searchParams = new URLSearchParams();

      searchParams.set("page", page.toString());
      fromDetails.url += `?${searchParams.toString()}`;
    }
  }
  const locals = {
    formAction: req.url,
    ...(from !== undefined && { from }),
    ...(page !== undefined && { page }),
    ...(fromDetails?.url?.length && { fromDetails }),
    ...(requestType !== undefined && { requestType }),
  };

  return locals;
};
