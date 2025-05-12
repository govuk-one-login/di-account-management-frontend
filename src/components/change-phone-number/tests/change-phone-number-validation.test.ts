import { describe } from "mocha";
import { validatePhoneNumberRequest } from "../change-phone-number-validation";
import { RequestBuilder } from "../../../../test/utils/builders";
import { Request } from "express";
import { sinon } from "../../../../test/utils/test-utils";
import { expect } from "chai";

const expectErrorMessage = async (req: Partial<Request>, msg: string) => {
  const validations = validatePhoneNumberRequest();
  let messageFound = false;
  const resultsArrays: any[] = [];

  for (const validation of validations) {
    // @ts-expect-error - 'run' doesn't exist error, but it does exist
    const result = await validation.run(req);
    const resultArray = result.array();
    resultsArrays.push(resultArray);
    messageFound = resultArray.some((res: any) => res.msg === msg);
    if (messageFound) break;
  }
  expect(messageFound).to.eq(
    true,
    `
  Expected to find error with message "${msg}" in one of the following arrays:
  ${resultsArrays.reduce(
    (append, resultArray) => `${append}
    ${JSON.stringify(resultArray, null, 2)}`,
    ""
  )}
  `.trim()
  );
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
    expect(
      await expectErrorMessage(
        req,
        "pages.changePhoneNumber.ukPhoneNumber.validationError.required"
      )
    ).to.not.throw();
  });

  it("errors as expected when phone number contains invalid characters", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "false",
        phoneNumber: "@12345",
      })
      .build();
    expect(
      await expectErrorMessage(
        req,
        "pages.changePhoneNumber.ukPhoneNumber.validationError.plusNumericOnly"
      )
    ).to.not.throw();
  });

  it("errors as expected when phone number is not long enough", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "false",
        phoneNumber: "123456789",
      })
      .build();
    expect(
      await expectErrorMessage(
        req,
        "pages.changePhoneNumber.ukPhoneNumber.validationError.length"
      )
    ).to.not.throw();
  });

  it("errors as expected when phone number is too long", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "false",
        phoneNumber: "123456789101112",
      })
      .build();
    expect(
      await expectErrorMessage(
        req,
        "pages.changePhoneNumber.ukPhoneNumber.validationError.length"
      )
    ).to.not.throw();
  });

  it("errors as expected when phone number is not a UK number", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "false",
        phoneNumber: "+33612345678",
      })
      .build();
    expect(
      await expectErrorMessage(
        req,
        "pages.changePhoneNumber.ukPhoneNumber.validationError.international"
      )
    ).to.not.throw();
  });

  it("errors as expected when phone number is already in use", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "false",
        phoneNumber: "0123456789",
      })
      .withMfaMethods()
      .build();
    expect(
      await expectErrorMessage(
        req,
        "pages.changePhoneNumber.ukPhoneNumber.validationError.samePhoneNumber"
      )
    ).to.not.throw();
  });

  it("errors as expected when no international phone number is provided", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "true",
        internationalPhoneNumber: "",
      })
      .build();
    expect(
      await expectErrorMessage(
        req,
        "pages.changePhoneNumber.internationalPhoneNumber.validationError.required"
      )
    ).to.not.throw();
  });

  it("errors as expected when international phone number contains invalid characters", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "true",
        internationalPhoneNumber: "@12345",
      })
      .build();
    expect(
      await expectErrorMessage(
        req,
        "pages.changePhoneNumber.internationalPhoneNumber.validationError.plusNumericOnly"
      )
    ).to.not.throw();
  });

  it("errors as expected when international phone number is not long enough", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "true",
        internationalPhoneNumber: "1234",
      })
      .build();
    expect(
      await expectErrorMessage(
        req,
        "pages.changePhoneNumber.internationalPhoneNumber.validationError.internationalFormat"
      )
    ).to.not.throw();
  });

  it("errors as expected when international phone number is too long", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "true",
        internationalPhoneNumber: "123456789123456789123456789",
      })
      .build();
    expect(
      await expectErrorMessage(
        req,
        "pages.changePhoneNumber.internationalPhoneNumber.validationError.internationalFormat"
      )
    ).to.not.throw();
  });

  it("errors as expected when international phone number is not an international number", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "true",
        internationalPhoneNumber: "07123456789",
      })
      .build();
    expect(
      await expectErrorMessage(
        req,
        "pages.changePhoneNumber.internationalPhoneNumber.validationError.internationalFormat"
      )
    ).to.not.throw();
  });

  it("errors as expected when international phone number is already in use", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "true",
        internationalPhoneNumber: "0123456789",
      })
      .withMfaMethods()
      .build();
    expect(
      await expectErrorMessage(
        req,
        "pages.changePhoneNumber.internationalPhoneNumber.validationError.samePhoneNumber"
      )
    ).to.not.throw();
  });
});
