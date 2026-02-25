import { Request, Response, NextFunction, RequestHandler } from "express";
import { UserJourney, EventType, getNextState } from "./state-machine";

export function SetState(
  currentStateTypes: UserJourney[],
  nextStateType: UserJourney,
  eventType: EventType,
  targetState: string
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session?.user?.state) {
      const error = new Error("User state is not initialized");
      req.log.error({ trace: res.locals.trace }, error.message);
      return next(error);
    }

    const currentStateType = currentStateTypes.find((stateType) =>
      Object.keys(req.session.user.state).includes(stateType)
    );

    if (req.session.user.state[nextStateType]?.value === targetState) {
      return next();
    }

    try {
      req.session.user.state[nextStateType] = getNextState(
        req.session.user.state[currentStateType]?.value || targetState,
        eventType
      );
      next();
    } catch (error) {
      req.log.error({ trace: res.locals.trace }, "State update failed.");
      next(error);
    }
  };
}
