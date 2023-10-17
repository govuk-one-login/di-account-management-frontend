import { TxMaEventServiceInterface, TxmaEvent } from "./types";
import { logger } from "../../utils/logger";

export function TxMaEventService(): TxMaEventServiceInterface {

  const send = function(txmaEvent: TxmaEvent) : void {
    logger.info({txmaEvent: txmaEvent} , "will use the SQSClient to send a txma event");
  };

  return {send};
}