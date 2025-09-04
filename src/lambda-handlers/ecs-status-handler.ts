import { ECSClient, DescribeServicesCommand } from "@aws-sdk/client-ecs";
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import { logError, logger } from "../utils/logger";

const ecs = new ECSClient({});
const cloudwatch = new CloudWatchClient({});

const CLUSTER_NAME = process.env.ECS_CLUSTER!;
const SERVICE_NAME = process.env.ECS_SERVICE!;
const METRIC_NAMESPACE = process.env.METRIC_NAMESPACE || "Custom/ECS";
const METRIC_NAME = "DeploymentInProgress";

export const handler = async (): Promise<void> => {
  try {
    const describeCommand = new DescribeServicesCommand({
      cluster: CLUSTER_NAME,
      services: [SERVICE_NAME],
    });

    const response = await ecs.send(describeCommand);
    const service = response.services?.[0];

    if (!service) {
      logger.warn(
        `ECS service ${SERVICE_NAME} not found in cluster ${CLUSTER_NAME}`
      );
      return;
    }

    const deployments = service.deployments ?? [];
    const inProgress = deployments.some(
      (d) => d.rolloutState === "IN_PROGRESS"
    );
    const metricValue = inProgress ? 1 : 0;

    const putMetricCommand = new PutMetricDataCommand({
      Namespace: METRIC_NAMESPACE,
      MetricData: [
        {
          MetricName: METRIC_NAME,
          Dimensions: [
            { Name: "ClusterName", Value: CLUSTER_NAME },
            { Name: "ServiceName", Value: SERVICE_NAME },
          ],
          Timestamp: new Date(),
          Value: metricValue,
          Unit: "Count",
        },
      ],
    });

    await cloudwatch.send(putMetricCommand);

    logger.info(`[ECS] Deployment in progress: ${metricValue}`);
  } catch (err) {
    logError(logger, "[ERROR] Failed to publish ECS deployment status:", err);
    throw err;
  }
};
