import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getSNSConfig,
  getSQSConfig,
  getAWSConfig,
  getKMSConfig,
  getDBConfig,
  sqsClient,
} from "../../../src/config/aws.js";
import * as config from "../../../src/config.js";
import * as readEnvs from "../../../src/utils/read-envs.js";

describe("AWS Config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getSNSConfig", () => {
    it("should return local config when in local environment", () => {
      vi.spyOn(config, "isLocalEnv").mockReturnValue(true);
      vi.spyOn(config, "getLocalStackBaseUrl").mockReturnValue(
        "http://localhost:4566"
      );
      vi.spyOn(config, "getAwsRegion").mockReturnValue("eu-west-2");

      const result = getSNSConfig();

      expect(result.awsConfig.endpoint).toBe("http://localhost:4566");
      expect(result.awsConfig.credentials?.accessKeyId).toBe("na");
      expect(result.awsConfig.credentials?.secretAccessKey).toBe("na"); //pragma: allowlist secret
      expect(result.awsConfig.region).toBe("eu-west-2");
    });

    it("should return production config when not in local environment", () => {
      vi.spyOn(config, "isLocalEnv").mockReturnValue(false);
      vi.spyOn(config, "getAwsRegion").mockReturnValue("eu-west-2");

      const result = getSNSConfig();

      expect(result.awsConfig.endpoint).toBeUndefined();
      expect(result.awsConfig.credentials).toBeUndefined();
      expect(result.awsConfig.region).toBe("eu-west-2");
    });
  });

  describe("getSQSConfig", () => {
    it("should return local config when in local environment", () => {
      vi.spyOn(config, "isLocalEnv").mockReturnValue(true);
      vi.spyOn(config, "getLocalStackBaseUrl").mockReturnValue(
        "http://localhost:4566"
      );
      vi.spyOn(config, "getAwsRegion").mockReturnValue("eu-west-2");

      const result = getSQSConfig();

      expect(result.awsConfig.endpoint).toBe("http://localhost:4566");
      expect(result.sqsClientConfig.endpoint).toBe("http://localstack:4566");
      expect((result.sqsClientConfig.credentials as any)?.accessKeyId).toBe(
        "na"
      );
      expect((result.sqsClientConfig.credentials as any)?.secretAccessKey).toBe(
        "na"
      );
      expect(result.sqsClientConfig.region).toBe("eu-west-2");
    });

    it("should return production config when not in local environment", () => {
      vi.spyOn(config, "isLocalEnv").mockReturnValue(false);
      vi.spyOn(config, "getAwsRegion").mockReturnValue("eu-west-2");

      const result = getSQSConfig();

      expect(result.awsConfig.endpoint).toBeUndefined();
      expect(result.sqsClientConfig.endpoint).toBeUndefined();
      expect(result.sqsClientConfig.credentials).toBeUndefined();
      expect(result.sqsClientConfig.region).toBe("eu-west-2");
    });
  });

  describe("getAWSConfig", () => {
    it("should return local config when in local environment", () => {
      vi.spyOn(config, "isLocalEnv").mockReturnValue(true);
      vi.spyOn(config, "getLocalStackBaseUrl").mockReturnValue(
        "http://localhost:4566"
      );
      vi.spyOn(config, "getAwsRegion").mockReturnValue("eu-west-2");

      const result = getAWSConfig();

      expect(result.endpoint).toBe("http://localhost:4566");
      expect((result.credentials as any)?.accessKeyId).toBe("na");
      expect((result.credentials as any)?.secretAccessKey).toBe("na");
      expect(result.region).toBe("eu-west-2");
    });

    it("should return production config when not in local environment", () => {
      vi.spyOn(config, "isLocalEnv").mockReturnValue(false);
      vi.spyOn(config, "getAwsRegion").mockReturnValue("eu-west-2");

      const result = getAWSConfig();

      expect(result.endpoint).toBeUndefined();
      expect(result.credentials).toBeUndefined();
      expect(result.region).toBe("eu-west-2");
    });
  });

  describe("getKMSConfig", () => {
    it("should return local config when in local environment", () => {
      vi.spyOn(config, "isLocalEnv").mockReturnValue(true);
      vi.spyOn(config, "getLocalStackBaseUrl").mockReturnValue(
        "http://localhost:4566"
      );
      vi.spyOn(config, "getAwsRegion").mockReturnValue("eu-west-2");
      vi.spyOn(readEnvs, "readEnvVar").mockReturnValue("local-key-123");

      const result = getKMSConfig();

      expect(result.awsConfig.endpoint).toBe("http://localhost:4566");
      expect(result.awsConfig.credentials?.accessKeyId).toBe("na");
      expect(result.kmsKeyId).toBe("local-key-123");
    });

    it("should return production config when not in local environment", () => {
      vi.spyOn(config, "isLocalEnv").mockReturnValue(false);
      vi.spyOn(config, "getAwsRegion").mockReturnValue("eu-west-2");
      vi.spyOn(config, "getKmsKeyId").mockReturnValue("prod-key-456");

      const result = getKMSConfig();

      expect(result.awsConfig.endpoint).toBeUndefined();
      expect(result.awsConfig.credentials).toBeUndefined();
      expect(result.kmsKeyId).toBe("prod-key-456");
    });
  });

  describe("getDBConfig", () => {
    it("should return config with credentials when provided", () => {
      const awsConfig = {
        endpoint: "http://localhost:4566",
        credentials: {
          accessKeyId: "test-key",
          secretAccessKey: "test-secret", //pragma: allowlist secret
        },
        region: "eu-west-2",
      };

      const result = getDBConfig(awsConfig);

      expect(result.endpoint).toBe("http://localhost:4566");
      expect((result.credentials as any)?.accessKeyId).toBe("test-key");
      expect((result.credentials as any)?.secretAccessKey).toBe("test-secret");
      expect(result.region).toBe("eu-west-2");
    });

    it("should return config without credentials when not provided", () => {
      const awsConfig = {
        region: "eu-west-2",
      };

      const result = getDBConfig(awsConfig);

      expect(result.endpoint).toBeUndefined();
      expect(result.credentials).toBeUndefined();
      expect(result.region).toBe("eu-west-2");
    });

    it("should use default AWS config when no config provided", () => {
      vi.spyOn(config, "isLocalEnv").mockReturnValue(false);
      vi.spyOn(config, "getAwsRegion").mockReturnValue("eu-west-2");

      const result = getDBConfig();

      expect(result.region).toBe("eu-west-2");
    });

    it("should handle partial credentials", () => {
      const awsConfig = {
        credentials: {
          accessKeyId: "test-key",
        },
        region: "eu-west-2",
      };

      const result = getDBConfig(awsConfig);

      expect((result.credentials as any)?.accessKeyId).toBe("test-key");
      expect((result.credentials as any)?.secretAccessKey).toBe("");
    });
  });

  describe("sqsClient singleton", () => {
    it("should return the same instance on multiple calls", () => {
      const client1 = sqsClient.getClient();
      const client2 = sqsClient.getClient();

      expect(client1).toBe(client2);
    });
  });
});
