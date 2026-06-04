import { createHash, randomUUID } from "node:crypto";
import { Request, Response } from "express";
import { getAmcJwe } from "./getAmcJwe.js";
import {
  getAmcAuthorizeUrl,
  getAmcClientId,
  getRootDomain,
} from "../config.js";

export async function initiateAmcRedirect(
  scope: string,
  req: Request,
  res: Response
): Promise<void> {
  const state = randomUUID();

  if (!req.session.amcStates) {
    req.session.amcStates = [];
  }
  req.session.amcStates.push(state);

  const { subjectId, publicSubjectId, email } = req.session.user;

  const { jws, jwe, redirectUri } = await getAmcJwe(
    scope,
    state,
    {
      internalPairwiseId: subjectId,
      publicSubjectId,
      email,
    },
    undefined,
    req.session.user.tokens.accountDataApiAccessToken
  );

  const url = new URL(getAmcAuthorizeUrl());
  url.searchParams.set("client_id", getAmcClientId());
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("request", jwe);
  url.searchParams.set("redirect_uri", redirectUri);

  const jwsHash = createHash("sha256").update(jws).digest("hex");
  res.cookie("amc", jwsHash, {
    secure: true,
    httpOnly: true,
    sameSite: "strict",
    domain: getRootDomain(),
  });

  res.redirect(url.toString());
}
