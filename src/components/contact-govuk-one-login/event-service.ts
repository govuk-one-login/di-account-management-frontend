import { EventServiceInterface, Event } from "./types";
import { logger } from "../../utils/logger";
import { SqsService } from "../../utils/types";
import { sqsService } from "../../utils/sqs";


export function EventService(sqs: SqsService = sqsService()): EventServiceInterface {

  const send = async function(event: Event) : Promise<void> {
    logger.info({Event: event} , "will use the SQSClient to send an audit event");
    await sqs.send(JSON.stringify(event));
  };

  return {send};
}