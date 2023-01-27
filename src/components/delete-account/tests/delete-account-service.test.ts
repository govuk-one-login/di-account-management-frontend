import { expect } from "chai";
import { describe } from "mocha";
import { SnsService } from "../../../utils/types";
import { sinon } from "../../../../test/utils/test-utils";

import {
  deleteAccountService,
} from "../delete-account-service";

describe("deleteAccountService", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    process.env.DELETE_TOPIC_ARN = "UserAccountDeletionEnv"
  });

  afterEach(() => {
    delete process.env.DELETE_TOPIC_ARN;
    sandbox.restore();
  });

  describe("deleteServiceData", () => {
    const expected_message = JSON.stringify({ "user_id": "abc", "access_token": "access_token",
  "email": "email", "source_ip": "source_ip", "session_id": "session_id", "persistent_session_id": "persistent_session_id",
      "public_subject_id": "public_subject_id", "legacy_subject_id": "legacy_subject_id"})


    it("fills the topic ARN from config if not provided", async () => {
      const fakeSnsService: SnsService = { publish: sandbox.fake() };  
      await deleteAccountService(fakeSnsService).deleteServiceData("abc", "access_token",
          "email", "source_ip", "session_id", "persistent_session_id", "public_subject_id",
          "legacy_subject_id")
      expect(fakeSnsService.publish).to.have.been.calledOnceWith(
        "UserAccountDeletionEnv",
        expected_message
      );
    })

    it("calls snsService.publish with a topic ARN and message JSON", async () => {
      const fakeSnsService: SnsService = { publish: sandbox.fake() };
      await deleteAccountService(fakeSnsService).deleteServiceData("abc", "access_token",
          "email", "source_ip", "session_id", "persistent_session_id", "public_subject_id",
          "legacy_subject_id", "UserAccountDeletion")
      expect(fakeSnsService.publish).to.have.been.calledOnceWith(
        "UserAccountDeletion",
        expected_message
      );
    })
  })
})
