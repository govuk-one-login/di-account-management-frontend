import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../test/utils/test-utils";
import { Request, Response } from "express";
import { RequestBuilder, ResponseBuilder } from "../../../test/utils/builders";
import { UserJourney, EventType } from "../state-machine";
import * as stateMachine from "../state-machine";

import { SetState } from "../set-state";

describe("setState", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: object;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = new RequestBuilder()
      .withSessionUserState({
        changePhoneNumber: {
          value: "CHANGE_VALUE",
        },
      })
      .build();

    res = new ResponseBuilder()
      .withRender(sandbox.fake())
      .withRedirect(sandbox.fake(() => {}))
      .withStatus(sandbox.fake())
      .withLocals({
        trace: "fake-trace",
      })
      .build();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should set the state value correctly", async () => {
    // Arrange
    const next = sandbox.fake();
    const setStateHandler = SetState(
      [UserJourney.ChangePhoneNumber],
      UserJourney.NoUKMobilePhone,
      EventType.SelectedApp,
      "APP"
    );

    // Act
    await setStateHandler(req as Request, res as Response, next);

    // Assert
    expect(Object.keys(req.session.user.state)).to.include(
      UserJourney.NoUKMobilePhone
    );
    expect(req.session.user.state[UserJourney.NoUKMobilePhone].value).to.equal(
      "APP"
    );
  });

  it("should only set the state if the target state is not already reached", async () => {
    // Arrange
    const next = sandbox.fake();
    req = new RequestBuilder()
      .withSessionUserState({
        changePhoneNumber: {
          value: "VERIFY_CODE_SENT",
        },
        noUkMobilePhone: {
          value: "VALUE_UPDATED",
        },
      })
      .build();

    const setStateHandler = SetState(
      [UserJourney.ChangePhoneNumber],
      UserJourney.NoUKMobilePhone,
      EventType.ValueUpdated,
      "VALUE_UPDATED"
    );

    const nextStateSpy = sandbox.spy(stateMachine, "getNextState");

    // Act
    await setStateHandler(req as Request, res as Response, next);

    // Assert
    expect(nextStateSpy).to.have.callCount(0);
    expect(next).to.have.been.calledOnce;
  });
});
