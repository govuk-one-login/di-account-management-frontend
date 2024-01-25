import { describe } from "mocha";
import { redact } from "../redact";
import { expect } from "chai";

describe("Redact tests", (): void => {
  it("Redacts a field from a JSON document.", (): void => {
    // Arrange
    const json: string = `
      {
        "name": "John Doe",
        "age": 42,
        "address": {
          "house": 12,
          "street": "Arcadia Avenue",
          "town": "Hyperion",
          "postcode": "HY1 1AA"
        }
      }
    `;

    // Act
    const result: string = redact(json, ["name"]);

    // Assert
    const resultAsObject: any = JSON.parse(result);
    expect(resultAsObject["name"]).to.equal("REDACTED");
  });
  it("Redacts multiple fields with the same name from a JSON document.", (): void => {
    // Arrange
    const json: string = `
      {
        "name": "John Doe",
        "age": 42,
        "address": {
          "house": 12,
          "name": "Dunroamin",
          "street": "Arcadia Avenue",
          "town": "Hyperion",
          "postcode": "HY1 1AA"
        }
      }
    `;

    // Act
    const result: string = redact(json, ["name"]);

    // Assert
    const resultAsObject: any = JSON.parse(result);
    expect(resultAsObject["name"]).to.equal("REDACTED");
    expect(resultAsObject["address"]["name"]).to.equal("REDACTED");
  });
  it("Redacts multiple fields with different names from a JSON document.", (): void => {
    // Arrange
    const json: string = `
      {
        "name": "John Doe",
        "age": 42,
        "address": {
          "house": 12,
          "street": "Arcadia Avenue",
          "town": "Hyperion",
          "postcode": "HY1 1AA"
        }
      }
    `;

    // Act
    const result: string = redact(json, ["name", "house"]);

    // Assert
    const resultAsObject: any = JSON.parse(result);
    expect(resultAsObject["name"]).to.equal("REDACTED");
    expect(resultAsObject["address"]["house"]).to.equal("REDACTED");
  });
  it("Redacts multiple fields from a list of names from a JSON document.", (): void => {
    // Arrange
    const json: string = `
      {
        "name": "John Doe",
        "age": 42,
        "address": {
          "house": 12,
          "name": "Dunroamin",
          "street": "Arcadia Avenue",
          "town": "Hyperion",
          "postcode": "HY1 1AA"
        }
      }
    `;

    // Act
    const result: string = redact(json, ["name", "town"]);

    // Assert
    const resultAsObject: any = JSON.parse(result);
    expect(resultAsObject["name"]).to.equal("REDACTED");
    expect(resultAsObject["address"]["name"]).to.equal("REDACTED");
    expect(resultAsObject["address"]["town"]).to.equal("REDACTED");
  });
  it("Does not redact objects.", (): void => {
    // Arrange
    const json: string = `
      {
        "name": "John Doe",
        "age": 42,
        "address": {
          "house": 12,
          "street": "Arcadia Avenue",
          "town": "Hyperion",
          "postcode": "HY1 1AA"
        }
      }
    `;

    // Act
    const result: string = redact(json, ["name", "town", "address"]);

    // Assert
    const resultAsObject: any = JSON.parse(result);
    expect(resultAsObject["name"]).to.equal("REDACTED");
    expect(resultAsObject["address"]["town"]).to.equal("REDACTED");
  });
});
