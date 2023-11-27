import { Request, Response, NextFunction } from "express";
import { PATH_DATA } from "../../app.constants";
import { formatEvent } from "../../utils/activityHistory";
import { getAppEnv, getDynamoActivityLogStoreTableName } from "../../config";
import { DynamoDB } from "aws-sdk";
import { dynamoDBService } from "../../utils/dynamo";
import { ActivityLogEntry } from "../../utils/types";
import { logger } from "../../utils/logger";
import assert from "node:assert";

const activityLogDynamoDBRequest = (
  subjectId: string,
  eventId: string
): DynamoDB.Types.QueryInput => ({
  TableName: getDynamoActivityLogStoreTableName(),
  KeyConditionExpression: "user_id = :user_id AND event_id = :event_id ",
  ExpressionAttributeValues: {
    ":user_id": { S: subjectId },
    ":event_id": { S: eventId },
  },
});

export async function reportSuspiciousActivityGet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  let alreadyReported;
  try {
    assert.ok(
      req.query.event !== undefined && req.query.event !== "",
      "mandatory query parameter 'event' missing from request"
    );
    assert.ok(
      req.query.reported !== undefined && req.query.reported !== "",
      "mandatory query parameter 'reported' missing from request"
    );
    try {
      assert.strictEqual(req.query.reported.toString(), "true");
      alreadyReported = true;
    } catch (err) {
      try {
        assert.strictEqual(req.query.reported.toString(), "false");
        alreadyReported = false;
      } catch (err) {
        req.log.error(
          `Query parameter "reported" was <${req.query.reported}> but expected "true" or "false" `
        );
        return next();
      }
    }
  } catch (err) {
    req.log.error(err.message);
    return next();
  }

  let eventDetails: ActivityLogEntry;
  try {
    const response = await dynamoDBService().queryItem(
      activityLogDynamoDBRequest(req.session.user_id, req.query.event as string)
    );
    if (response.Items.length !== 1) {
      req.log.error(
        `Event ${req.query.event} matched ${response.Items.length} Items when 1 was expected.`
      );
      return next();
    }
    eventDetails = DynamoDB.Converter.unmarshall(
      response.Items[0]
    ) as ActivityLogEntry;
    assert.ok(
      eventDetails.reported_suspicious === alreadyReported,
      `event showed reported_suspicious as ${eventDetails.reported_suspicious} but request param reported was ${alreadyReported}`
    );
  } catch (err) {
    req.log.error(err.message);
    return next(err);
  }

  const formattedEventDetails = formatEvent(eventDetails);

  const additionalData = alreadyReported
    ? {
        reportNumber: formattedEventDetails.reportNumber,
        contactUrl: PATH_DATA.CONTACT.url,
        eventReportedTime: formattedEventDetails.reportedSuspiciousTime,
      }
    : { event: formattedEventDetails, env: getAppEnv() };

  const data = {
    page: req.query.page,
    backLink: `${PATH_DATA.SIGN_IN_HISTORY.url}${
      req.query.page ? "?page=" + req.query.page : ""
    }`,
    email: req.session.user.email,
    eventId: req.query.event,
    reportSuspiciousActivityUrl: PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url,
    alreadyReported: alreadyReported,
  };

  res.render("report-suspicious-activity/index.njk", {
    ...data,
    ...additionalData,
  });
}

export async function reportSuspiciousActivityPost(
  req: Request,
  res: Response
): Promise<void> {
  const page = req.body.page;

  logger.info(
    { trace: res.locals.trace },
    "TBD Send event to SNS to trigger back processing."
  );

  res.render("report-suspicious-activity/success.njk", {
    backLink: `${PATH_DATA.SIGN_IN_HISTORY.url}?page=${page}`,
    email: req.session.user.email,
    contactLink: PATH_DATA.CONTACT.url,
    changePasswordLink: PATH_DATA.CHANGE_PASSWORD.url,
  });
}
