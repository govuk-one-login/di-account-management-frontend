export interface LogoutToken {
  iss: string;
  sub?: string;
  aud: string;
  iat: number;
  jti: string;
  sid?: string;
  events?: any;
}
