import {
  GetItemCommand,
  QueryCommand,
  QueryCommandOutput,
} from "@aws-sdk/client-dynamodb";

import { SignCommandOutput } from "@aws-sdk/client-kms";
import { PublishCommandOutput } from "@aws-sdk/client-sns";
import { AddMfaMethod, MfaMethod } from "./mfa/types";
import { GetCommandOutput } from "@aws-sdk/lib-dynamodb";

export interface UserServices {
  user_id: string;
  services: Service[];
}

export interface Service {
  client_id: string;
  count_successful_logins: number;
  last_accessed: number;
  last_accessed_readable_format: string;
  hasDetailedCard?: boolean;
}

export interface YourServices {
  accountsList: Service[];
  servicesList: Service[];
}

export interface KmsService {
  sign: (payload: string) => Promise<SignCommandOutput>;
}

export interface ActivityLogEntry {
  user_id: string;
  timestamp: number;
  client_id: string;
  event_id: string;
  event_type: string;
  reported_suspicious?: boolean;
  session_id: string;
  truncated: boolean;
  reported_suspicious_time?: number;
  zendesk_ticket_number?: string;
}

export interface FormattedActivityLog {
  userId: string | null;
  time: string;
  clientId: string | null;
  eventId: string | null;
  eventType: string | null;
  reportedSuspicious?: boolean;
  sessionId: string | null;
  reportSuspiciousActivityUrl?: string;
  visitedService?: string;
  visitedServiceId?: string;
  reportNumber?: string;
  reportedSuspiciousTime?: string;
}

export interface SnsService {
  publish: (
    topic_arn: string,
    message: string
  ) => Promise<PublishCommandOutput>;
}

export interface SqsService {
  send: (message: string, trace: string) => Promise<string | undefined>;
}

export interface DynamoDBService {
  getItem: (getCommand: GetItemCommand) => Promise<GetCommandOutput>;
  queryItem: (queryCommand: QueryCommand) => Promise<QueryCommandOutput>;
}

export interface AwsConfig {
  AWS_ACCESS_KEY_ID: string;
  AWS_REGION: string;
  AWS_SECRET_ACCESS_KEY: string;
  KMS_KEY_ALIAS: string;
  KMS_KEY_ID: string;
}

export interface ClientAssertionServiceInterface {
  generateAssertionJwt: (
    clientId: string,
    tokenEndpointUri: string
  ) => Promise<string>;
}

export interface ApiResponse {
  code?: number;
  message?: string;
  email?: string;
  data: any;
}

export interface ApiResponseResult {
  success: boolean;
  code?: number;
  message?: string;
}

export interface Error {
  text: string;
  href: string;
}

export interface UpdateInformationInput {
  email: string;
  credential?: string;
  updatedValue?: string;
  otp: string;
  mfaMethod?: MfaMethod;
}

export interface AddMFAMethodInput {
  email: string;
  credential?: string;
  otp: string;
  mfaMethod?: AddMfaMethod;
  methodVerified?: boolean;
}

export interface UpdateInformationSessionValues {
  accessToken: string;
  sourceIp: string;
  sessionId: string;
  persistentSessionId: string;
  userLanguage: string;
  clientSessionId: string;
  txmaAuditEncoded: string;
}

export const allowedTxmaEvents: string[] = [
  "AUTH_AUTH_CODE_ISSUED",
  "AUTH_IPV_AUTHORISATION_REQUESTED",
];
