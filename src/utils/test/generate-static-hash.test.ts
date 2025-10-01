import { describe } from "mocha";
import { expect } from "chai";
import { generateStaticHash } from "../generate-static-hash";

const originalEnv = { ...process.env };

describe("generateStaticHash", () => {
  beforeEach(() => {
    process.env.STATIC_ASSETS_PATH = ".";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should return a non-empty hash string", async () => {
    const hash = await generateStaticHash();
    expect(hash).to.be.a("string").that.is.not.empty;
  });

  it("should return the same hash on subsequent calls", async () => {
    const hash1 = await generateStaticHash();
    const hash2 = await generateStaticHash();
    expect(hash1).to.equal(hash2);
  });
});
