import { expect } from "chai";
import { describe } from "mocha";
import { isTokenExpired } from "../../../src/utils/oidc";
import { UnsecuredJWT } from "jose";

describe("oidc", () => {
  describe("isTokenExpired", () => {
    it("should return false when token doesn't expire in next 60 seconds", () => {
      const accessToken = new UnsecuredJWT({})
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer("urn:example:issuer")
        .setAudience("urn:example:audience")
        .setExpirationTime("2h")
        .encode();

      const value = isTokenExpired(accessToken);
      expect(value).to.equal(false);
    });

    it("should return true when token expires in next 60 seconds", () => {
      const next30Seconds = new Date();
      next30Seconds.setSeconds(30);

      const accessToken = new UnsecuredJWT({
        exp: Math.round(next30Seconds.getTime() / 1000),
      })
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer("urn:example:issuer")
        .setAudience("urn:example:audience")
        .encode();

      const value = isTokenExpired(accessToken);
      expect(value).to.equal(true);
    });
  });
});
