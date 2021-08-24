export interface CallbackServiceInterface {
  generateAssertionJwt: (
    clientId: string,
    tokenEndpointUri: string
  ) => Promise<string>;
}
