import { describe } from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import { handler } from "../ecs-status-handler";
import { ECSClient } from "@aws-sdk/client-ecs";
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";

describe("ECS Deployment Metric Lambda", () => {
  let ecsSendStub: sinon.SinonStub;
  let cwSendStub: sinon.SinonStub;

  beforeEach(() => {
    process.env.ECS_CLUSTER = "my-cluster";
    process.env.ECS_SERVICE = "my-service";
    process.env.METRIC_NAMESPACE = "Custom/ECS";

    ecsSendStub = sinon.stub(ECSClient.prototype, "send");
    cwSendStub = sinon.stub(CloudWatchClient.prototype, "send");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should publish metric value 1 when deployment is in progress", async () => {
    ecsSendStub.resolves({
      services: [
        {
          deployments: [
            {
              rolloutState: "IN_PROGRESS",
            },
          ],
        },
      ],
    });

    cwSendStub.resolves({});

    await handler();

    expect(ecsSendStub.calledOnce).to.be.true;
    expect(cwSendStub.calledOnce).to.be.true;

    const cwCommand = cwSendStub.getCall(0).args[0] as PutMetricDataCommand;
    const metric = cwCommand.input.MetricData![0];

    expect(metric.MetricName).to.equal("DeploymentInProgress");
    expect(metric.Value).to.equal(1);
  });

  it("should publish metric value 0 when no deployment is in progress", async () => {
    ecsSendStub.resolves({
      services: [
        {
          deployments: [
            {
              rolloutState: "COMPLETED",
            },
          ],
        },
      ],
    });

    cwSendStub.resolves({});

    await handler();

    expect(ecsSendStub.calledOnce).to.be.true;
    expect(cwSendStub.calledOnce).to.be.true;

    const metric = cwSendStub.getCall(0).args[0].input.MetricData[0];
    expect(metric.Value).to.equal(0);
  });

  it("should not send metric if ECS service is missing", async () => {
    ecsSendStub.resolves({
      services: [],
    });

    await handler();

    expect(cwSendStub.called).to.be.false;
  });

  it("should throw and log if ECS fails", async () => {
    const error = new Error("ECS failure");
    ecsSendStub.rejects(error);

    try {
      await handler();
      throw new Error("Expected handler to throw");
    } catch (err) {
      expect(err).to.equal(error);
      expect(cwSendStub.called).to.be.false;
    }
  });
});
