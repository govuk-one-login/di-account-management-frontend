import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { RequestBuilder, ResponseBuilder } from "../../../test/utils/builders.js";
import { UserJourney, EventType } from "../state-machine.js";
import * as stateMachine from "../state-machine.js";
import { SetState } from "../set-state.js";

describe("setState", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = new RequestBuilder()
      .withSessionUserState({
        changePhoneNumber: {
          value: "CHANGE_VALUE",
        },
      })
      .build();

    res = new ResponseBuilder()
      .withRender(vi.fn())
      .withRedirect(vi.fn())
      .withStatus(vi.fn())
      .withLocals({
        trace: "fake-trace",
      })
      .build();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should set the state value correctly", async () => {
    // Arrange
    const next = vi.fn();
    const setStateHandler = SetState(
      [UserJourney.ChangePhoneNumber],
      UserJourney.NoUKMobilePhone,
      EventType.SelectedApp,
      "APP"
    );

    // Act
    await setStateHandler(req as Request, res as Response, next);

    // Assert
    expect(Object.keys(req.session.user.state)).toContain(
      UserJourney.NoUKMobilePhone
    );
    expect(req.session.user.state[UserJourney.NoUKMobilePhone].value).toBe(
      "APP"
    );
  });

  it("should only set the state if the target state is not already reached", async () => {
    // Arrange
    const next = vi.fn();
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

    const nextStateSpy = vi.spyOn(stateMachine, "getNextState");

    // Act
    await setStateHandler(req as Request, res as Response, next);

    // Assert
    expect(nextStateSpy).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledOnce();
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
        error: vi.fn(),
      })
      .build();

    req.log = {
      error: vi.fn(),
    };

    const next = vi.fn();
    const error = new Error("State update failed");
    const getNextStateStub = vi
      .spyOn(stateMachine, "getNextState")
      .mockImplementation(() => {
        throw error;
      });

    const setStateHandler = SetState(
      [UserJourney.ChangePhoneNumber],
      UserJourney.NoUKMobilePhone,
      EventType.ValueUpdated,
      "VALUE_UPDATED"
    );

    // Act
    await setStateHandler(req as Request, res as Response, next);

    // Assert
    expect(getNextStateStub).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(error);
  });

  it("should call next with error if user state is not initialized", async () => {
    // Arrange
    req = new RequestBuilder().withLog({}).build();

    req.session.user.state = undefined;

    const logErrorSpy = vi.fn();
    req.log = {
      error: logErrorSpy,
    };

    const next = vi.fn();
    const setStateHandler = SetState(
      [UserJourney.ChangePhoneNumber],
      UserJourney.NoUKMobilePhone,
      EventType.ValueUpdated,
      "VALUE_UPDATED"
    );

    // Act
    await setStateHandler(req as Request, res as Response, next);

    // Assert
    expect(logErrorSpy).toHaveBeenCalledWith(
      { trace: res.locals.trace },
      "User state is not initialized"
    );
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].message).toBe("User state is not initialized");
  });
});
