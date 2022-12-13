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
  last_accessed: string;
}

export interface YourServices {
  accountsList: Service[];
  servicesList: Service[];
}

export interface KmsService {
  sign: (payload: string) => Promise<KMS.Types.SignResponse>;
}

export interface SnsService {
  publish: (
    topic_arn: string,
    message: string
  ) => Promise<SNS.Types.PublishResponse>;
}

export interface DynamoDBService {
  getItem: (
    getCommand: DynamoDB.Types.GetItemInput
  ) => Promise<DynamoDB.Types.GetItemOutput>;
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

export interface SubjectSessionIndexService {
  addSession: (subjectId: string, sessionId: string) => void;
  removeSession: (subjectId: string, sessionId: string) => void;
  getSessions: (subjectId: string) => Promise<string[]>;
}
