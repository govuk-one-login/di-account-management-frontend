import { Request, Response, NextFunction } from "express";
import { PATH_DATA } from "../../app.constants";
// import { formatEvent } from "../../utils/activityHistory";
import { getAppEnv, getDynamoActivityLogStoreTableName } from "../../config";
import { DynamoDB } from "aws-sdk";
import { dynamoDBService } from "../../utils/dynamo";
import { ActivityLogEntry, FormattedActivityLog } from "../../utils/types";
import assert from "node:assert";
import { formatActivityLogs } from "../../utils/activityHistory";
import { decryptData } from "../../utils/decrypt-data";

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
  try {
    assert.ok(
      req.query.event !== undefined && req.query.event !== "",
      "mandatory query parameter 'event' missing from request"
    );
  } catch (err) {
    req.log.error(err.message);
    return next();
  }

  let activityLog: ActivityLogEntry;

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
    activityLog = DynamoDB.Converter.unmarshall(
      response.Items[0]
    ) as ActivityLogEntry;
  } catch (err) {
    req.log.error(err.message);
    return next(err);
  }

  activityLog.event_type = await decryptData(
    activityLog.event_type,
    activityLog.user_id,
    res.locals.trace
  );

  const formattedActivityLogs: FormattedActivityLog = formatActivityLogs(
    [activityLog],
    res.locals.trace
  )[0];

  const activityLogDetails = formattedActivityLogs?.reportedSuspicious
    ? {
        reportNumber: formattedActivityLogs?.reportNumber,
        contactUrl: PATH_DATA.CONTACT.url,
        eventReportedTime: formattedActivityLogs?.reportedSuspiciousTime,
      }
    : { event: formattedActivityLogs, env: getAppEnv() };

  const data = {
    page: req.query.page,
    backLink: `${PATH_DATA.SIGN_IN_HISTORY.url}${
      req.query.page ? "?page=" + req.query.page : ""
    }`,
    email: req.session.user.email,
    eventId: req.query.event,
    reportSuspiciousActivityUrl: PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url,
    alreadyReported: formattedActivityLogs?.reportedSuspicious,
  };

  res.render("report-suspicious-activity/index.njk", {
    ...data,
    ...activityLogDetails,
  });
}

export async function reportSuspiciousActivityPost(
  req: Request,
  res: Response
): Promise<void> {
  const page = req.body.page;

  req.log.info("TBD Send event to SNS to trigger back processing.");

  res.render("report-suspicious-activity/success.njk", {
    backLink: `${PATH_DATA.SIGN_IN_HISTORY.url}?page=${page}`,
    email: req.session.user.email,
    contactLink: PATH_DATA.CONTACT.url,
    changePasswordLink: PATH_DATA.SECURITY.url,
  });
}
