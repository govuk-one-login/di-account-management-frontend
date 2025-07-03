import { Request, Response } from "express";
import { handleLogout } from "../../utils/logout";
import { LogoutState } from "../../app.constants";

export async function logoutPost(req: Request, res: Response): Promise<void> {
  await handleLogout(req, res, LogoutState.Default);
}
