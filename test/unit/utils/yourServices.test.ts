import { expect } from "chai";
import { describe } from "mocha";
import {
  formatService,
  presentYourServices,
} from "../../../src/utils/yourServices";
import * as yourServices from "../../../src/utils/yourServices";
import type { DynamoDBService, Service } from "../../../src/utils/types";
import sinon from "sinon";
import {
  GetItemCommandOutput,
  QueryCommandOutput,
} from "@aws-sdk/client-dynamodb";
import * as dynamo from "../../../src/utils/dynamo";

describe("YourService Util", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(yourServices, "getServices").resolves([
      {
        client_id: "prisonVisits",
        count_successful_logins: 1,
        last_accessed: 14567776,
        last_accessed_readable_format: "last_accessed_readable_format",
        hasDetailedCard: true,
        isAvailableInWelsh: false,
      },
      {
        client_id: "mortgageDeed",
        count_successful_logins: 1,
        last_accessed: 14567776,
        last_accessed_readable_format: "last_accessed_readable_format",
        hasDetailedCard: true,
        isAvailableInWelsh: false,
      },
      {
        client_id: "dfeApplyForTeacherTraining",
        count_successful_logins: 2,
        last_accessed: 14567776,
        last_accessed_readable_format: "last_accessed_readable_format",
        hasDetailedCard: false,
        isAvailableInWelsh: false,
      },
      {
        client_id: "vehicleOperatorLicense",
        count_successful_logins: 3,
        last_accessed: 14567776,
        last_accessed_readable_format: "last_accessed_readable_format",
        hasDetailedCard: false,
        isAvailableInWelsh: true,
      },
      {
        client_id: "nonExistent",
        count_successful_logins: 1,
        last_accessed: 14567776,
        last_accessed_readable_format: "last_accessed_readable_format",
        hasDetailedCard: true,
        isAvailableInWelsh: true,
      },
    ]);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("get services", () => {
    it("gets services and returns the expected date", async () => {
      sandbox.restore();

      const dynamodbGetItemOutput = {
        $metadata: {
          httpStatusCode: 200,
          requestId: "9dd17f00-efce-4a2f-8a3e-54cf41c196bf",
          attempts: 1,
          totalRetryDelay: 0,
        },
        Item: {
          user_id: { S: "urn:fdc:gov.uk:default" },
          services: {
            L: [
              {
                M: {
                  count_successful_logins: {
                    N: "4",
                  },
                  last_accessed: {
                    N: "1666169856",
                  },
                  client_id: {
                    S: "gov-uk",
                  },
                  last_accessed_pretty: {
                    S: "20 January 1970",
                  },
                },
              },
              {
                M: {
                  count_successful_logins: {
                    N: "4",
                  },
                  last_accessed: {
                    N: "1696969856",
                  },
                  client_id: {
                    S: "hmrc",
                  },
                  last_accessed_pretty: {
                    S: "20 January 1970",
                  },
                },
              },
            ],
          },
        },
      };
      const mockDynamoDBService: DynamoDBService = {
        getItem(): Promise<GetItemCommandOutput> {
          return Promise.resolve(dynamodbGetItemOutput);
        },
        queryItem(): Promise<QueryCommandOutput> {
          return Promise.resolve({} as QueryCommandOutput);
        },
      };
      const dynamoDBServiceStub = sandbox.stub(dynamo, "dynamoDBService");
      dynamoDBServiceStub.returns(mockDynamoDBService);

      const services = await yourServices.getServices("subjectId", "trace");

      expect(services).to.deep.equal([
        {
          count_successful_logins: 4,
          last_accessed: 1666169856,
          client_id: "gov-uk",
          last_accessed_pretty: "20 January 1970",
          isAvailableInWelsh: false,
        },
        {
          count_successful_logins: 4,
          last_accessed: 1696969856,
          client_id: "hmrc",
          last_accessed_pretty: "20 January 1970",
          isAvailableInWelsh: false,
        },
      ]);
    });

    it("gets services has no match", async () => {
      sandbox.restore();

      const dynamodbGetItemOutput = {
        $metadata: {
          httpStatusCode: 200,
          requestId: "9dd17f00-efce-4a2f-8a3e-54cf41c196bf",
          attempts: 1,
          totalRetryDelay: 0,
        },
      };

      const mockDynamoDBService: DynamoDBService = {
        getItem(): Promise<GetItemCommandOutput> {
          return Promise.resolve(dynamodbGetItemOutput);
        },
        queryItem(): Promise<QueryCommandOutput> {
          return Promise.resolve({} as QueryCommandOutput);
        },
      };
      const dynamoDBServiceStub = sandbox.stub(dynamo, "dynamoDBService");
      dynamoDBServiceStub.returns(mockDynamoDBService);

      const services = await yourServices.getServices("subjectId", "trace");

      expect(services).to.deep.equal([]);
    });
  });

  describe("format service information to diplay", () => {
    it("It takes a date epoch in seconds and returns a pretty formatted date", async () => {
      const dateEpochInSeconds = 1673358736;
      const serviceFromDb: Service = {
        client_id: "a_client_id",
        count_successful_logins: 1,
        last_accessed: dateEpochInSeconds,
        last_accessed_readable_format: "1673356836",
        isAvailableInWelsh: true,
      };

      const formattedService: Service = formatService(serviceFromDb, "en");

      expect(formattedService.client_id).equal("a_client_id");
      expect(formattedService.count_successful_logins).equal(1);
      expect(formattedService.last_accessed_readable_format).equal(
        "10 January 2023"
      );
      expect(formattedService.isAvailableInWelsh).to.be.true;
    });

    it("format service object with hasDetailedCard if service is hmrc", async () => {
      const dateEpochInSeconds = 1673358736;
      const serviceFromDb: Service = {
        client_id: "hmrc",
        count_successful_logins: 1,
        last_accessed: dateEpochInSeconds,
        last_accessed_readable_format: "1673356836",
      };

      const formattedService: Service = formatService(serviceFromDb, "en");

      expect(formattedService.hasDetailedCard).equal(false);
      expect(formattedService.isAvailableInWelsh).to.be.undefined;
    });
  });

  describe("does GovUK Publishing service exist in array", async () => {
    it("should return a list of services for the user", async () => {
      const expectedResponse = {
        accountsList: [
          {
            client_id: "prisonVisits",
            count_successful_logins: 1,
            hasDetailedCard: false,
            isAvailableInWelsh: false,
            last_accessed: 14567776,
            last_accessed_readable_format: "1 January 1970",
          },
          {
            client_id: "dfeApplyForTeacherTraining",
            count_successful_logins: 2,
            hasDetailedCard: false,
            isAvailableInWelsh: false,
            last_accessed: 14567776,
            last_accessed_readable_format: "1 January 1970",
          },
        ],
        servicesList: [
          {
            client_id: "mortgageDeed",
            count_successful_logins: 1,
            hasDetailedCard: false,
            last_accessed: 14567776,
            last_accessed_readable_format: "1 January 1970",
            isAvailableInWelsh: false,
          },
          {
            client_id: "vehicleOperatorLicense",
            count_successful_logins: 3,
            hasDetailedCard: false,
            isAvailableInWelsh: true,
            last_accessed: 14567776,
            last_accessed_readable_format: "1 January 1970",
          },
        ],
      };

      const services = await presentYourServices("subjectId", "trace");
      expect(services).to.deep.equal(expectedResponse);
    });
  });

  describe("getYourServicesForAccountDeletion", () => {
    it("returns a list of services in the expected format", async () => {
      const mockTranslate = sinon.stub().callsFake((id) => id);

      const expectedResponse: Service[] = [
        {
          client_id: "dfeApplyForTeacherTraining",
          count_successful_logins: 2,
          hasDetailedCard: false,
          isAvailableInWelsh: false,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
        },
        {
          client_id: "mortgageDeed",
          count_successful_logins: 1,
          hasDetailedCard: true,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
          isAvailableInWelsh: false,
        },
        {
          client_id: "prisonVisits",
          count_successful_logins: 1,
          hasDetailedCard: true,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
          isAvailableInWelsh: false,
        },
        {
          client_id: "vehicleOperatorLicense",
          count_successful_logins: 3,
          hasDetailedCard: false,
          isAvailableInWelsh: true,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
        },
      ];

      const services = await yourServices.getYourServicesForAccountDeletion(
        "subjectId",
        "trace",
        mockTranslate
      );
      expect(services).to.deep.equal(expectedResponse);
    });
  });
});
