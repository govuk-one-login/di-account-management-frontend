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
      req.log.error(
        { trace: res.locals.trace },
        "User state is not initialized"
      );
      return next();
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
