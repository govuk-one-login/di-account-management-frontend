import { expect } from "chai";
import { describe } from "mocha";
import { SnsService } from "../../../utils/types.js";
import { sinon } from "../../../../test/utils/test-utils.js";
import { http } from "../../../utils/http.js";

import { deleteAccountService } from "../delete-account-service";

describe("deleteAccountService", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    process.env.DELETE_TOPIC_ARN = "UserAccountDeletionEnv";
  });

  afterEach(() => {
    delete process.env.DELETE_TOPIC_ARN;
    sandbox.restore();
  });

  describe("deleteServiceData", () => {
    const expected_message = JSON.stringify({
      user_id: "abc",
      public_subject_id: "def",
    });

    it("fills the topic ARN from config if not provided", async () => {
      const fakeSnsService: SnsService = { publish: sandbox.fake() };
      await deleteAccountService(http, fakeSnsService).publishToDeleteTopic(
        "abc",
        "def"
      );
      expect(fakeSnsService.publish).to.have.been.calledOnceWith(
        "UserAccountDeletionEnv",
        expected_message
      );
    });

    it("calls snsService.publish with a topic ARN and message JSON", async () => {
      const fakeSnsService: SnsService = { publish: sandbox.fake() };
      await deleteAccountService(http, fakeSnsService).publishToDeleteTopic(
        "abc",
        "def",
        undefined,
        "UserAccountDeletion"
      );
      expect(fakeSnsService.publish).to.have.been.calledOnceWith(
        "UserAccountDeletion",
        expected_message
      );
    });
  });
});
