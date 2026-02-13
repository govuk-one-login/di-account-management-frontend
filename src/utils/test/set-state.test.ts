import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../test/utils/test-utils";
import { Request } from "express";
import { RequestBuilder } from "../../../test/utils/builders";

import { SetState } from "../set-state";
import { UserJourney, EventType } from "../state-machine";

describe("setState", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = new RequestBuilder()
      .withSessionUserState({
        changePhoneNumber: {
          value: "CHANGE_VALUE",
        },
      })
      .build();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it.only("should set the state value correctly", () => {
    // Arrange
    const next = sandbox.fake();
    const setState = SetState;

    // Act
    setState(
      req as Request,
      UserJourney.ChangePhoneNumber,
      UserJourney.NoUKMobilePhone,
      EventType.SelectedApp,
      next
    );

    // Assert
    expect(Object.keys(req.session.user.state)).to.include(
      UserJourney.NoUKMobilePhone
    );
    expect(req.session.user.state[UserJourney.NoUKMobilePhone].value).to.equal(
      "APP"
    );
  });
});
