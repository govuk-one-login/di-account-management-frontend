import { ECSClient, DescribeServicesCommand } from "@aws-sdk/client-ecs";
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";

const ecs = new ECSClient({});
const cloudwatch = new CloudWatchClient({});

const CLUSTER_NAME = process.env.ECS_CLUSTER;
const SERVICE_NAME = process.env.ECS_SERVICE;
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

    console.log(`Service details are: ${JSON.stringify(service)}`);

    if (!service) {
      console.warn(
        `ECS service ${SERVICE_NAME} not found in cluster ${CLUSTER_NAME}`
      );
      return;
    }

    const taskSets = service.taskSets ?? [];

    console.log(`Total Task sets: ${taskSets.length}`);

    let inProgress = taskSets.length > 1;

    if (!inProgress) {
      inProgress = taskSets.some((ts) => ts.status !== "PRIMARY");
    }

    taskSets.forEach((ts) => {
      console.log(`Task Set Info is: createdAt: ${ts.createdAt}, id: ${ts.id}, stabilityStatus: 
      ${ts.stabilityStatus},status: ${ts.status},
      computedDesiredCount: ${ts.computedDesiredCount}`);
    });

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

    console.log(`[ECS] Deployment in progress: ${metricValue}`);
  } catch (err) {
    console.log("[ERROR] Failed to publish ECS deployment status:", err);
    throw err;
  }
};
