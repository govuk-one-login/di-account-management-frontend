import { KMS, SNS, DynamoDB } from "aws-sdk";

type ClientId = string;
type UrnFdnSub = string;

export interface UserServices {
  user_id: UrnFdnSub;
  services: Service[];
}

export interface Service {
  client_id: ClientId;
  count_successful_logins: number;
  last_accessed: number;
  last_accessed_readable_format: string;
}

export interface YourServices {
  accountsList: Service[];
  servicesList: Service[];
}

export interface KmsService {
  sign: (payload: string) => Promise<KMS.Types.SignResponse>;
}

export interface ActivityLogEntry {
  event_type: string;
  session_id: string;
  user_id: string;
  timestamp: number;
  activities?: Activity[];
  truncated: boolean;
}

export interface Activity {
  type: string;
  client_id: ClientId;
  timestamp: number;
}

export interface SnsService {
  publish: (
    topic_arn: string,
    message: string
  ) => Promise<SNS.Types.PublishResponse>;
}

export interface SqsService {
  send: (
    message: string,
  ) =>  Promise<string | undefined>
}

export interface DynamoDBService {
  getItem: (
    getCommand: DynamoDB.Types.GetItemInput
  ) => Promise<DynamoDB.Types.GetItemOutput>;
  queryItem: (
    queryCommand: DynamoDB.Types.QueryInput
  ) => Promise<DynamoDB.Types.QueryOutput>;
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
  updatedValue: string;
  otp: string;
}

export interface UpdateInformationSessionValues {
  accessToken: string;
  sourceIp: string;
  sessionId: string;
  persistentSessionId: string;
  userLanguage: string;
}

export const allowedTxmaEvents: Array<string> = [
  "AUTH_AUTH_CODE_ISSUED",
  "AUTH_IPV_AUTHORISATION_REQUESTED",
];
