import { mfaMethodTypes } from "../utils/mfaClient/types";
import { EventName } from "../app.constants";
import { Request, Response } from "express";

export interface EventServiceInterface {
  buildAuditEvent: (
    req: Request,
    res: Response,
    eventName: EventName
  ) => AuditEvent;
  send: (event: Event, trace: string) => void;
}
export interface Event {
  event_name: EventName;
}

export interface AuditEvent extends Event {
  timestamp: number;
  event_timestamp_ms: number;
  event_timestamp_ms_formatted: string;
  component_id: string;
  user: User;
  client_id?: string;
  platform: Platform;
  extensions?: Extensions;
  restricted?: Restricted;
}

export interface Restricted {
  device_information?: DeviceInformation;
}

export interface DeviceInformation {
  encoded: string;
}

export interface User {
  session_id: string;
  persistent_session_id: string;
  user_id: string;
  email?: string;
  ip_address?: string;
  govuk_signin_journey_id?: string;
}

export interface Platform {
  user_agent: string;
}

export interface Extensions {
  from_url?: string;
  app_session_id?: string;
  app_error_code?: string;
  reference_code?: string;
  is_signed_in?: boolean;
  "journey-type"?: "ACCOUNT_MANAGEMENT";
  "mfa-type"?: (typeof mfaMethodTypes)[keyof typeof mfaMethodTypes];
}

export interface CurrentTimeDescriptor {
  isoString: string;
  milliseconds: number;
  seconds: number;
}
