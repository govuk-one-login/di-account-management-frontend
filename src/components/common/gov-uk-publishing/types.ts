export interface GovUkNotificationRequest {
  publicSubjectId: string;
  newEmail?: string;
  legacySubjectId: string;
}

export interface GovUkPublishingServiceInterface {
  notifyEmailChanged: (request: GovUkNotificationRequest) => Promise<void>;
  notifyAccountDeleted: (request: GovUkNotificationRequest) => Promise<void>;
}
