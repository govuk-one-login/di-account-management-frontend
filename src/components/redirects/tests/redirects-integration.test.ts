import request from "supertest";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import { PATH_DATA, WELL_KNOWN_FILES } from "../../../app.constants";
import decache from "decache";

describe("Integration::redirects", () => {
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

  describe("security.txt", async () => {
    it("302 redirects to cabinet office security.txt", (done) => {
      request(app)
        .get(PATH_DATA.SECURITY_TXT.url)
        .expect("Location", WELL_KNOWN_FILES.SECURITY_TEXT_URL)
        .expect(302, done());
    });
  });

  describe("thanks.txt", async () => {
    it("302 redirects to cabinet office thanks.txt", (done) => {
      request(app)
        .get(PATH_DATA.THANKS_TXT.url)
        .expect("Location", WELL_KNOWN_FILES.THANKS_TEXT_URL)
        .expect(302, done());
    });
  });
});
