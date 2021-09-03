export interface UpdateInfo {
  updateInfoType: string,
  existingProfileAttribute: string,
  replacementProfileAttribute: string
}

export interface EnterNewEmailServiceInterface {
  updateEmail: (
    accessToken: string,
    existingEmail: string,
    replacementEmail: string
  ) => Promise<void>;
}
