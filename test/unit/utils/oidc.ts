import { expect } from "chai";
import { describe } from "mocha";
import { isTokenExpired } from "../../../src/utils/oidc";
import { JWT } from "jose";


describe("oidc", () => {
  describe("isTokenExpired", () => {
    it("should return false when token doesn't expire in next 60 seconds", () => {
      const accessToken =  JWT.sign(
        { sub: "12345", exp: "1758477938" },
        "secret"
      );

      const value = isTokenExpired(accessToken);
      expect(value).to.equal(false);
    });

    it("should return true when token expires in next 60 seconds", () => {
      const next30Seconds = new Date();
      next30Seconds.setSeconds(30);

      const accessToken =  JWT.sign(
        { sub: "12345", exp: Math.round(next30Seconds.getTime() / 1000) },
        "secret"
      );
      const value = isTokenExpired(accessToken);
      expect(value).to.equal(true);
    });
  });
});
