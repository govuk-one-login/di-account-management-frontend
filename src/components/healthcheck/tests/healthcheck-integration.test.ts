import request from "supertest";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import { PATH_DATA } from "../../../app.constants";

describe("Integration::healthcheck", () => {
  let sandbox: sinon.SinonSandbox;
  let app: any;

  before(() => {
    sandbox = sinon.createSandbox();
    app = require("../../../app").createApp();
  });

  after(() => {
    sandbox.restore();
    app = undefined;
  });

  it("healthcheck should return 200 OK", (done) => {
    request(app).get(PATH_DATA.HEALTHCHECK.url).expect(200, done);
  });
});
