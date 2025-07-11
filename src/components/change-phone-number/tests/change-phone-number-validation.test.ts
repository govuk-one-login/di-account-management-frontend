import { describe } from "mocha";
import { validatePhoneNumberRequest } from "../change-phone-number-validation";
import { RequestBuilder } from "../../../../test/utils/builders";
import { Request } from "express";
import { sinon } from "../../../../test/utils/test-utils";
import { Assertion, expect } from "chai";
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Chai {
    interface Assertion {
      validationError(msg: string): Promise<void>;
    }
  }
}

function validationError(msg: string) {
  let messageFound = false;
  for (const resultArray of this._obj) {
    messageFound = resultArray.some((res: any) => res.msg === msg);
    if (messageFound) break;
  }

  this.assert(
    messageFound,
    `
  Expected to find error with message "${msg}" in one of the following arrays:
  ${this._obj.reduce(
    (append: string, resultArray: any[]) => `${append}
    ${JSON.stringify(resultArray, null, 2)}`,
    ""
  )}
  `.trim()
  );
}

Assertion.addMethod("validationError", validationError);

const validate = async (req: Partial<Request>) => {
  const validations = validatePhoneNumberRequest();
  const resultsArrays: any[] = [];

  for (const validation of validations) {
    // @ts-expect-error - 'run' doesn't exist error, but it does exist
    const result = await validation.run(req);
    resultsArrays.push(result.array());
  }

  return resultsArrays;
};

describe("validatePhoneNumberRequest", () => {
  let sandbox: sinon.SinonSandbox;
  let reqBuilder: RequestBuilder;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    reqBuilder = new RequestBuilder().withTranslate(sandbox.fake((id) => id));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("errors as expected when no phone number is provided", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "false",
        phoneNumber: "",
      })
      .build();
    await expect(await validate(req)).to.have.validationError(
      "pages.changePhoneNumber.ukPhoneNumber.validationError.required"
    );
  });

  it("errors as expected when phone number contains invalid characters", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "false",
        phoneNumber: "@12345",
      })
      .build();
    await expect(await validate(req)).to.have.validationError(
      "pages.changePhoneNumber.ukPhoneNumber.validationError.plusNumericOnly"
    );
  });

  it("errors as expected when phone number is not long enough", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "false",
        phoneNumber: "123456789",
      })
      .build();
    await expect(await validate(req)).to.have.validationError(
      "pages.changePhoneNumber.ukPhoneNumber.validationError.length"
    );
  });

  it("errors as expected when phone number is too long", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "false",
        phoneNumber: "123456789101112",
      })
      .build();
    await expect(await validate(req)).to.have.validationError(
      "pages.changePhoneNumber.ukPhoneNumber.validationError.length"
    );
  });

  it("errors as expected when phone number is not a UK number", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "false",
        phoneNumber: "+33612345678",
      })
      .build();
    await expect(await validate(req)).to.have.validationError(
      "pages.changePhoneNumber.ukPhoneNumber.validationError.international"
    );
  });

  it("errors as expected when no international phone number is provided", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "true",
        internationalPhoneNumber: "",
      })
      .build();
    await expect(await validate(req)).to.have.validationError(
      "pages.changePhoneNumber.internationalPhoneNumber.validationError.required"
    );
  });

  it("errors as expected when international phone number contains invalid characters", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "true",
        internationalPhoneNumber: "@12345",
      })
      .build();
    await expect(await validate(req)).to.have.validationError(
      "pages.changePhoneNumber.internationalPhoneNumber.validationError.plusNumericOnly"
    );
  });

  it("errors as expected when international phone number is not long enough", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "true",
        internationalPhoneNumber: "1234",
      })
      .build();
    await expect(await validate(req)).to.have.validationError(
      "pages.changePhoneNumber.internationalPhoneNumber.validationError.internationalFormat"
    );
  });

  it("errors as expected when international phone number is too long", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "true",
        internationalPhoneNumber: "123456789123456789123456789",
      })
      .build();
    await expect(await validate(req)).to.have.validationError(
      "pages.changePhoneNumber.internationalPhoneNumber.validationError.internationalFormat"
    );
  });

  it("errors as expected when international phone number is not an international number", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "true",
        internationalPhoneNumber: "07123456789",
      })
      .build();
    await expect(await validate(req)).to.have.validationError(
      "pages.changePhoneNumber.internationalPhoneNumber.validationError.internationalFormat"
    );
  });
});
