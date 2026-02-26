import { Request, Response } from "express";
import { s3Client } from "../../config/aws";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { HTTP_STATUS_CODES } from "../../app.constants";

export async function jwksGet(req: Request, res: Response): Promise<void> {
  try {
    const response = await s3Client.getClient().send(
      new GetObjectCommand({
        Bucket: process.env.JWKS_BUCKET_NAME,
        Key: "jwks.json",
      })
    );

    const jwks = await response.Body?.transformToString();
    res.setHeader("Content-Type", "application/json");
    res.status(HTTP_STATUS_CODES.OK).send(jwks);
  } catch (error) {
    req.log.error(`Failed to fetch JWKS: ${error}`);
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
}
