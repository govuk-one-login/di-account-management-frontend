import nock from "nock";
import { sinon } from "../../../../test/utils/test-utils";
import { changeAuthenticatorAppService } from "../change-authenticator-app-service";
import { expect } from "chai";
import {
  UpdateInformationInput,
  UpdateInformationSessionValues,
} from "../../../utils/types";
import { describe } from "mocha";
import {
  CLIENT_SESSION_ID,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import { MfaMethod } from "../../../utils/mfa/types";
import * as mfaModule from "../../../utils/mfa";

describe("changeAuthenticatorAppService", () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
  });

  it("update the authenticator app with mfa method management api", async () => {
    const accessToken = "1234";
    const email = "something@test.com";
    const authSecret = "wewrtywwerty2";
    const otp = "9876";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const userLanguage = "en";

    process.env.SUPPORT_CHANGE_MFA = "1";

    const mfaMethod: MfaMethod = {
      mfaIdentifier: 2,
      priorityIdentifier: "BACKUP",
      method: {
        mfaMethodType: "AUTH_APP",
        credential: "ABC",
      },
      methodVerified: true,
    };

    const updateMfaMethod = sinon.fake.returns(Promise.resolve(true));

    sandbox.replace(
      mfaModule,
      "updateMfaMethod",
      updateMfaMethod as typeof mfaModule.updateMfaMethod
    );

    const updateInput: UpdateInformationInput = {
      email,
      updatedValue: authSecret,
      otp,
      mfaMethod,
    };

    const sessionDetails: UpdateInformationSessionValues = {
      accessToken,
      sourceIp,
      sessionId,
      persistentSessionId,
      userLanguage,
      clientSessionId: CLIENT_SESSION_ID,
      txmaAuditEncoded: TXMA_AUDIT_ENCODED,
    };

    const authAppUpdated =
      await changeAuthenticatorAppService().updateAuthenticatorApp(
        updateInput,
        sessionDetails
      );

    expect(authAppUpdated).to.be.true;
    delete process.env.SUPPORT_CHANGE_MFA;
  });
});
