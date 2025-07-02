import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS_CODES, PATH_DATA } from "../../app.constants";
import {
  getAppEnv,
  getDynamoActivityLogStoreTableName,
  getOIDCClientId,
  reportSuspiciousActivity,
  getSNSSuspicousActivityTopic,
} from "../../config";
import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDBService } from "../../utils/dynamo";
import { ActivityLogEntry, FormattedActivityLog } from "../../utils/types";
import assert from "node:assert";
import { formatActivityLogs } from "../../utils/activityHistory";
import { decryptData } from "../../utils/decrypt-data";
import { snsService } from "../../utils/sns";
import { getTxmaHeader } from "../../utils/txma-header";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { logger } from "../../utils/logger";
import { ACTIVITY_COMMON_OPL_SETTINGS, setOplSettings } from "../../utils/opl";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

const activityLogDynamoDBRequest = (
  subjectId: string,
  eventId: string
): QueryCommand => {
  const params = {
    TableName: getDynamoActivityLogStoreTableName(),
    KeyConditionExpression: "user_id = :user_id AND event_id = :event_id ",
    ExpressionAttributeValues: {
      ":user_id": { S: subjectId },
      ":event_id": { S: eventId },
    },
  };
  return new QueryCommand(params);
};

interface ReportSuspiciousActivityParams {
  user_id: string;
  event_id: string;
  email: string;
  persistent_session_id: string;
  session_id: string;
  reported_suspicious_time: number;
  device_information?: string;
  topic_arn?: string;
}

const publishToSuspiciousActivityTopic = async function ({
  user_id,
  event_id,
  email,
  persistent_session_id,
  session_id,
  reported_suspicious_time,
  device_information,
  topic_arn = getSNSSuspicousActivityTopic(),
}: ReportSuspiciousActivityParams): Promise<void> {
  const sns = snsService();
  await sns.publish(
    topic_arn,
    JSON.stringify({
      user_id,
      email,
      event_id,
      persistent_session_id,
      session_id,
      reported_suspicious_time,
      device_information,
    })
  );
};

export async function reportSuspiciousActivityGet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  req.metrics?.addMetric("reportSuspiciousActivityGet", MetricUnit.Count, 1);
  if (!reportSuspiciousActivity()) {
    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    res.render("common/errors/404.njk");
  } else {
    try {
      assert.ok(
        req.query.event !== undefined && req.query.event !== "",
        "mandatory query parameter 'event' missing from request"
      );
    } catch (error) {
      req.log.error(error.message);
      return next();
    }

    let activityLog: ActivityLogEntry;

    try {
      const response = await dynamoDBService().queryItem(
        activityLogDynamoDBRequest(
          req.session.user_id,
          req.query.event as string
        )
      );
      if (response.Items.length !== 1) {
        req.log.error(
          `Event ${req.query.event} matched ${response.Items.length} Items when 1 was expected.`
        );
        return next();
      }
      activityLog = unmarshall(response.Items[0]) as ActivityLogEntry;
    } catch (error) {
      req.log.error(error.message);
      return next(error);
    }

    activityLog.event_type = await decryptData(
      activityLog.event_type,
      activityLog.user_id,
      res.locals.trace
    );

    const formattedActivityLogs: FormattedActivityLog = formatActivityLogs(
      [activityLog],
      res.locals.trace,
      undefined,
      req.i18n?.language
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
      homeClientId: getOIDCClientId(),
    };

    setOplSettings(
      {
        ...ACTIVITY_COMMON_OPL_SETTINGS,
        contentId: data.alreadyReported
          ? "5f83e2b4-6c9d-4b98-b68e-43d4f6892b56"
          : "0252c1d4-c233-48c1-bf4b-a5b124ed8ec2",
      },
      res
    );

    res.render("report-suspicious-activity/index.njk", {
      ...data,
      ...activityLogDetails,
    });
  }
}

export async function reportSuspiciousActivityPost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  req.metrics?.addMetric("reportSuspiciousActivityPost", MetricUnit.Count, 1);
  if (!reportSuspiciousActivity()) {
    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    res.render("common/errors/404.njk");
  } else {
    try {
      assert(req.session.user_id, "user_id not found in session");
      assert(req.session.user.email, "email not found in session");
      assert(req.body.event_id, "event_id not found in request body");
      assert(
        res.locals.persistentSessionId,
        "persistentSessionId not found in response locals"
      );
      assert(res.locals.sessionId, "sessionId not found in response locals");

      await publishToSuspiciousActivityTopic({
        user_id: req.session.user_id,
        email: req.session.user.email,
        event_id: req.body.event_id,
        persistent_session_id: res.locals.persistentSessionId,
        session_id: res.locals.sessionId,
        reported_suspicious_time: new Date().getTime(),
        device_information: getTxmaHeader(req, res.locals.trace),
      });
    } catch (error) {
      req.log.error(error.message);
      return next(error);
    }

    let pageUrlParam = "";
    if (req.body.page !== undefined) {
      const pageNum = parseInt(req.body.page, 10);
      if (Number.isInteger(pageNum) && pageNum > 0) {
        pageUrlParam = `?page=${pageNum}`;
      }
    }

    res.redirect(
      PATH_DATA.REPORT_SUSPICIOUS_ACTIVITY.url + "/done" + pageUrlParam
    );
  }
}

export async function reportSuspiciousActivityConfirmationGet(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric(
    "reportSuspiciousActivityConfirmation",
    MetricUnit.Count,
    1
  );
  if (!reportSuspiciousActivity()) {
    logger.error({
      err: "Report suspicious activity controller: should not load, sending user to a 404",
    });
    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    res.render("common/errors/404.njk");
  } else {
    setOplSettings(
      {
        ...ACTIVITY_COMMON_OPL_SETTINGS,
        contentId: "e047725a-f19a-448a-9f8d-1e9e08f5c21f",
      },
      res
    );

    res.render("report-suspicious-activity/success.njk", {
      backLink: `${PATH_DATA.SIGN_IN_HISTORY.url}?page=${req.query.page || 1}`,
      email: req.session.user.email,
      contactLink: PATH_DATA.CONTACT.url,
      changePasswordLink: PATH_DATA.SECURITY.url,
    });
  }
}
