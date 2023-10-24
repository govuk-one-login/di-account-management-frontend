import { EventServiceInterface, Event } from "./types";
import { SqsService } from "../../utils/types";
import { sqsService } from "../../utils/sqs";

export function eventService(sqs: SqsService = sqsService()): EventServiceInterface {

  const send = async function(event: Event) : Promise<void> {
    await sqs.send(JSON.stringify(event));
  };

  return {send};
}