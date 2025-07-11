import request from "supertest";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import { PATH_DATA } from "../../../app.constants";
import decache from "decache";

describe("Integration::healthcheck", () => {
  let sandbox: sinon.SinonSandbox;
  let app: any;

  before(async () => {
    decache("../../../app");
    decache("../../../middleware/requires-auth-middleware");
    sandbox = sinon.createSandbox();
    const oidc = require("../../../utils/oidc");
    sandbox.stub(oidc, "getOIDCClient").callsFake(() => {
      return Promise.resolve({});
    });
    app = await require("../../../app").createApp();
  });

  after(() => {
    sandbox.restore();
    app = undefined;
  });

  it("healthcheck should return 200 OK", (done) => {
    request(app).get(PATH_DATA.HEALTHCHECK.url).expect(200, done);
  });
});
