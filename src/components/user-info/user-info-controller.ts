import { Request, Response } from "express";

export async function userInfoGet(req: Request, res: Response): Promise<void> {
  const { session } = req;
  if (session) {
    res.json(session);
  }
}
