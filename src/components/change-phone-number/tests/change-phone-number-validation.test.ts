import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validatePhoneNumberRequest } from "../change-phone-number-validation.js";
import { RequestBuilder } from "../../../../test/utils/builders";
import { Request } from "express";

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

const hasValidationError = (resultsArrays: any[], msg: string): boolean => {
  for (const resultArray of resultsArrays) {
    const messageFound = resultArray.some((res: any) => res.msg === msg);
    if (messageFound) return true;
  }
  return false;
};

describe("validatePhoneNumberRequest", () => {
  let reqBuilder: RequestBuilder;

  beforeEach(() => {
    reqBuilder = new RequestBuilder().withTranslate(vi.fn((id) => id));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("errors as expected when no phone number is provided", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "false",
        phoneNumber: "",
      })
      .build();
    const results = await validate(req);
    expect(
      hasValidationError(
        results,
        "pages.changePhoneNumber.ukPhoneNumber.validationError.required"
      )
    ).toBe(true);
  });

  it("errors as expected when phone number contains invalid characters", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "false",
        phoneNumber: "@12345",
      })
      .build();
    const results = await validate(req);
    expect(
      hasValidationError(
        results,
        "pages.changePhoneNumber.ukPhoneNumber.validationError.plusNumericOnly"
      )
    ).toBe(true);
  });

  it("errors as expected when phone number is not long enough", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "false",
        phoneNumber: "123456789",
      })
      .build();
    const results = await validate(req);
    expect(
      hasValidationError(
        results,
        "pages.changePhoneNumber.ukPhoneNumber.validationError.length"
      )
    ).toBe(true);
  });

  it("errors as expected when phone number is too long", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "false",
        phoneNumber: "123456789101112",
      })
      .build();
    const results = await validate(req);
    expect(
      hasValidationError(
        results,
        "pages.changePhoneNumber.ukPhoneNumber.validationError.length"
      )
    ).toBe(true);
  });

  it("errors as expected when phone number is not a UK number", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "false",
        phoneNumber: "+33612345678",
      })
      .build();
    const results = await validate(req);
    expect(
      hasValidationError(
        results,
        "pages.changePhoneNumber.ukPhoneNumber.validationError.international"
      )
    ).toBe(true);
  });

  it("errors as expected when no international phone number is provided", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "true",
        internationalPhoneNumber: "",
      })
      .build();
    const results = await validate(req);
    expect(
      hasValidationError(
        results,
        "pages.changePhoneNumber.internationalPhoneNumber.validationError.required"
      )
    ).toBe(true);
  });

  it("errors as expected when international phone number contains invalid characters", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "true",
        internationalPhoneNumber: "@12345",
      })
      .build();
    const results = await validate(req);
    expect(
      hasValidationError(
        results,
        "pages.changePhoneNumber.internationalPhoneNumber.validationError.plusNumericOnly"
      )
    ).toBe(true);
  });

  it("errors as expected when international phone number is not long enough", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "true",
        internationalPhoneNumber: "1234",
      })
      .build();
    const results = await validate(req);
    expect(
      hasValidationError(
        results,
        "pages.changePhoneNumber.internationalPhoneNumber.validationError.internationalFormat"
      )
    ).toBe(true);
  });

  it("errors as expected when international phone number is too long", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "true",
        internationalPhoneNumber: "123456789123456789123456789",
      })
      .build();
    const results = await validate(req);
    expect(
      hasValidationError(
        results,
        "pages.changePhoneNumber.internationalPhoneNumber.validationError.internationalFormat"
      )
    ).toBe(true);
  });

  it("errors as expected when international phone number is not an international number", async () => {
    const req = reqBuilder
      .withBody({
        hasInternationalPhoneNumber: "true",
        internationalPhoneNumber: "07123456789",
      })
      .build();
    const results = await validate(req);
    expect(
      hasValidationError(
        results,
        "pages.changePhoneNumber.internationalPhoneNumber.validationError.internationalFormat"
      )
    ).toBe(true);
  });
});
