import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import { logoutRedirectGet } from "../logout-redirect-controller";

import {
  RequestBuilder,
  ResponseBuilder,
} from "../../../../test/utils/builders";
import { LogoutState, PATH_DATA } from "../../../app.constants";
import { getBaseUrl } from "../../../config";

describe("logout redirect controller", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = new RequestBuilder().build();

    res = new ResponseBuilder().withRedirect(sinon.fake(() => {})).build();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should redirect to suspended", async () => {
    req.query = { state: LogoutState.Suspended };

    await logoutRedirectGet(req, res);

    expect(res.redirect).to.have.calledWith(
      `${getBaseUrl() + PATH_DATA.UNAVAILABLE_TEMPORARY.url}`
    );
  });

  it("should redirect to blocked", async () => {
    req.query = { state: LogoutState.Blocked };

    await logoutRedirectGet(req, res);

    expect(res.redirect).to.have.calledWith(
      `${getBaseUrl() + PATH_DATA.UNAVAILABLE_PERMANENT.url}`
    );
  });

  it("should redirect to account deletion", async () => {
    req.query = { state: LogoutState.AccountDeletion };

    await logoutRedirectGet(req, res);

    expect(res.redirect).to.have.calledWith(
      `${getBaseUrl() + PATH_DATA.ACCOUNT_DELETED_CONFIRMATION.url}`
    );
  });

  it("should redirect to start", async () => {
    req.query = { state: LogoutState.Start };

    await logoutRedirectGet(req, res);

    expect(res.redirect).to.have.calledWith(
      `${getBaseUrl() + PATH_DATA.START.url}`
    );
  });

  it("should redirect to default if state is not set", async () => {
    req.query = {};

    await logoutRedirectGet(req, res);

    expect(res.redirect).to.have.calledWith(
      `${getBaseUrl() + PATH_DATA.USER_SIGNED_OUT.url}`
    );
  });
});
