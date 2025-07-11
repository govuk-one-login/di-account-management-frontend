import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import {
  RequestBuilder,
  ResponseBuilder,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import {
  addMfaSmsMethodPost,
  addMfaSmsMethodGet,
  addMfaSmsMethodConfirmationGet,
} from "../add-mfa-method-sms-controller";
import { ERROR_CODES, PATH_DATA } from "../../../app.constants";
import { ChangePhoneNumberServiceInterface } from "../../change-phone-number/types";
import * as oidcModule from "../../../utils/oidc";
import Sinon from "sinon";

describe("addMfaSmsMethodPost", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = new RequestBuilder()
      .withBody({})
      .withSessionUserState({ addBackup: { value: "CHANGE_VALUE" } })
      .withTranslate(sandbox.fake((id) => id))
      .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
      .build();

    res = new ResponseBuilder()
      .withRender(sandbox.fake())
      .withRedirect(sandbox.fake())
      .withStatus(sandbox.fake())
      .build();

    sandbox.replace(oidcModule, "refreshToken", async () => {});
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should redirect the user to the check phone page", async () => {
    const fakeService: ChangePhoneNumberServiceInterface = {
      sendPhoneVerificationNotification: sandbox.fake.resolves({
        success: true,
      }),
    };
    req.body.phoneNumber = "07123456789";
    if (req.session) {
      req.session.save = sandbox.stub();
    }

    await addMfaSmsMethodPost(fakeService)(req as Request, res as Response);
    expect(req.session?.save).to.be.calledOnce;
    expect(req.session?.user.newPhoneNumber).to.eq("07123456789");
    (req.session?.save as Sinon.SinonStub).getCall(0).args[0]();
    expect(res.redirect).to.be.calledWith(
      `${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=addBackup`
    );
    expect(res.render).not.to.be.called;
    expect(res.status).not.to.be.called;
  });

  it("should display errors when trying to change phone number to the existing phone number", async () => {
    const fakeService: ChangePhoneNumberServiceInterface = {
      sendPhoneVerificationNotification: sandbox.fake.resolves({
        success: false,
        code: ERROR_CODES.NEW_PHONE_NUMBER_SAME_AS_EXISTING,
      }),
    };
    if (req.session) {
      req.session.save = sandbox.stub();
    }

    await addMfaSmsMethodPost(fakeService)(req as Request, res as Response);
    expect(req.session?.save).not.to.be.called;
    expect(res.render).to.be.calledWith("add-mfa-method-sms/index.njk", {
      errors: {
        phoneNumber: {
          text: "pages.changePhoneNumber.validationError.samePhoneNumber",
          href: "#phoneNumber",
        },
      },
      errorList: [
        {
          text: "pages.changePhoneNumber.validationError.samePhoneNumber",
          href: "#phoneNumber",
        },
      ],
      backLink: "/back-from-set-up-method",
      language: "en",
    });
    expect(res.status).to.be.calledWith(400);
  });
});

describe("addMfaSmsMethodGet", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = new RequestBuilder().build();

    res = new ResponseBuilder().withRender(sandbox.fake()).build();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should call render with the expected arguments", async () => {
    await addMfaSmsMethodGet(req as Request, res as Response);
    expect(res.render).to.be.calledWith("add-mfa-method-sms/index.njk", {
      backLink: "/back-from-set-up-method",
    });
  });
});

describe("addMfaSmsMethodConfirmationGet", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = new RequestBuilder()
      .withBody({})
      .withSessionUserState({ addBackup: { value: "CHANGE_VALUE" } })
      .withTranslate(sandbox.fake((id) => id))
      .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
      .build();

    res = new ResponseBuilder().withRender(sandbox.fake()).build();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should call render with the expected arguments", async () => {
    await addMfaSmsMethodConfirmationGet(req as Request, res as Response);
    expect(res.render).to.be.calledWith("update-confirmation/index.njk", {
      pageTitle: "pages.addBackupSms.confirm.title",
      panelText: "pages.addBackupSms.confirm.heading",
      summaryText: "pages.addBackupSms.confirm.message",
    });
  });
});
