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
  let res: Partial<Response>;

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

  it("should call next with an error if state update fails", async () => {
    // Arrange
    req = new RequestBuilder()
      .withSessionUserState({
        changePhoneNumber: {
          value: "CHANGE_VALUE",
        },
      })
      .withLog({
        error: sandbox.fake(),
      })
      .build();

    req.log = {
      error: sandbox.fake(),
    };

    const next = sandbox.fake();
    const error = new Error("State update failed");
    const getNextStateStub = sandbox
      .stub(stateMachine, "getNextState")
      .throws(error);

    const setStateHandler = SetState(
      [UserJourney.ChangePhoneNumber],
      UserJourney.NoUKMobilePhone,
      EventType.ValueUpdated,
      "VALUE_UPDATED"
    );

    // Act
    await setStateHandler(req as Request, res as Response, next);

    // Assert
    expect(getNextStateStub).to.have.been.calledOnce;
    expect(next).to.have.been.calledWith(error);
  });

  it("should call next with error if user state is not initialized", async () => {
    // Arrange
    req = new RequestBuilder().withLog({}).build();

    req.session.user.state = undefined;

    const logErrorSpy = sandbox.fake();
    req.log = {
      error: logErrorSpy,
    };

    const next = sandbox.fake();
    const setStateHandler = SetState(
      [UserJourney.ChangePhoneNumber],
      UserJourney.NoUKMobilePhone,
      EventType.ValueUpdated,
      "VALUE_UPDATED"
    );

    // Act
    await setStateHandler(req as Request, res as Response, next);

    // Assert
    expect(logErrorSpy).to.have.been.calledWith(
      { trace: res.locals.trace },
      "User state is not initialized"
    );
    expect(next).to.have.been.calledOnceWith(
      sinon.match
        .instanceOf(Error)
        .and(sinon.match.has("message", "User state is not initialized"))
    );
  });
});
