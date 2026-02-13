import { Request, NextFunction } from "express";
import { EventType, getNextState, UserJourney } from "./state-machine";

export function SetState(
  req: Request,
  currentStateType: UserJourney,
  nextStateType: UserJourney,
  eventType: EventType,
  next: NextFunction
): void {
  if (!req.session.user.state) {
    req.log.error("User state is not initialized");
    return;
  }

  req.session.user.state[nextStateType] = getNextState(
    req.session.user.state[currentStateType]?.value,
    eventType
  );

  next();
}
