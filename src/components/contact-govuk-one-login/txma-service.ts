import { TxMaEventServiceInterface, TxMaEvent } from "./types";
import { logger } from "../../utils/logger";

export function TxMaEventService(): TxMaEventServiceInterface {

  const send = function(txmaEvent: TxMaEvent) : void {
    logger.info({txMaEvent: txmaEvent} , "will use the SQSClient to send a txma event");
  };

  return {send};
}