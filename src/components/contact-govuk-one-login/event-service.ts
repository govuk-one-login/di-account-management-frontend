import { EventServiceInterface, Event } from "./types";
import { logger } from "../../utils/logger";

export function EventService(): EventServiceInterface {

  const send = function(event: Event) : void {
    logger.info({Event: event} , "will use the SQSClient to send an audit event");
  };

  return {send};
}