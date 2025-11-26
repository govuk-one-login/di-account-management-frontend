import { expect } from "chai";
import { describe, it } from "mocha";
import { createTimedMemoize } from "../../../src/utils/createTimedMemoize";
import { sinon } from "../../utils/test-utils";

describe("createTimedMemoize", () => {
  it("should return cached result within maxAge", () => {
    const mockFn = sinon.stub().returns("result");
    const memoized = createTimedMemoize(mockFn, 1000);

    const result1 = memoized("arg1");
    const result2 = memoized("arg1");

    expect(result1).to.equal("result");
    expect(result2).to.equal("result");
    expect(mockFn.callCount).to.equal(1);
  });

  it("should call function again after maxAge expires", async () => {
    const mockFn = sinon.stub().returns("result");
    const memoized = createTimedMemoize(mockFn, 10);

    memoized("arg1");
    await new Promise((resolve) => setTimeout(resolve, 15));
    memoized("arg1");

    expect(mockFn.callCount).to.equal(2);
  });

  it("should cache different arguments separately", () => {
    const mockFn = sinon.stub().callsFake((arg) => `result-${arg}`);
    const memoized = createTimedMemoize(mockFn, 1000);

    const result1 = memoized("arg1");
    const result2 = memoized("arg2");
    const result3 = memoized("arg1");

    expect(result1).to.equal("result-arg1");
    expect(result2).to.equal("result-arg2");
    expect(result3).to.equal("result-arg1");
    expect(mockFn.callCount).to.equal(2);
  });

  it("should handle multiple arguments", () => {
    const mockFn = sinon.stub().returns("result");
    const memoized = createTimedMemoize(mockFn, 1000);

    memoized("arg1", "arg2", 123);
    memoized("arg1", "arg2", 123);
    memoized("arg1", "arg2", 123, 567);
    memoized("arg1", "arg2", 123, 567);

    expect(mockFn.callCount).to.equal(2);
  });

  it("should handle functions with no arguments", () => {
    const mockFn = sinon.stub().returns("result");
    const memoized = createTimedMemoize(mockFn, 1000);

    memoized();
    memoized();

    expect(mockFn.callCount).to.equal(1);
  });

  it("should handle object arguments by reference", () => {
    const mockFn = sinon.stub().returns("result");
    const memoized = createTimedMemoize(mockFn, 1000);

    const obj = { key: "value" };
    memoized(obj);
    memoized({ key: "value" }); // Different object reference
    memoized(obj); // Same reference, should use cache

    expect(mockFn.callCount).to.equal(2);
  });

  it("should differentiate objects with different content", () => {
    const mockFn = sinon.stub().returns("result");
    const memoized = createTimedMemoize(mockFn, 1000);

    memoized({ key: "value1" });
    memoized({ key: "value2" });
    memoized({ key: "value1" }); // Different reference, not cached

    expect(mockFn.callCount).to.equal(3);
  });

  it("should treat null and undefined as different values", () => {
    const mockFn = sinon.stub().returns("result");
    const memoized = createTimedMemoize(mockFn, 1000);

    memoized(null);
    memoized(undefined);
    memoized(null); // Should use cache

    expect(mockFn.callCount).to.equal(2);
  });

  it("should handle array arguments by reference", () => {
    const mockFn = sinon.stub().returns("result");
    const memoized = createTimedMemoize(mockFn, 1000);

    const arr = [1, 2, 3];
    memoized(arr);
    memoized([1, 2, 3]); // Different array reference
    memoized(arr); // Same reference, should use cache

    expect(mockFn.callCount).to.equal(2);
  });

  it("should not cache errors", () => {
    const mockFn = sinon.stub().throws(new Error("test error"));
    const memoized = createTimedMemoize(mockFn, 1000);

    expect(() => memoized("arg")).to.throw("test error");
    expect(() => memoized("arg")).to.throw("test error");
    expect(mockFn.callCount).to.equal(2);
  });

  it("should handle zero maxAge", () => {
    const mockFn = sinon.stub().returns("result");
    const memoized = createTimedMemoize(mockFn, 0);

    memoized("arg");
    memoized("arg");

    expect(mockFn.callCount).to.equal(2);
  });

  it("should handle negative maxAge", () => {
    const mockFn = sinon.stub().returns("result");
    const memoized = createTimedMemoize(mockFn, -100);

    memoized("arg");
    memoized("arg");

    expect(mockFn.callCount).to.equal(2);
  });

  it("should preserve function return types", () => {
    const numberFn = sinon.stub().returns(42);
    const stringFn = sinon.stub().returns("hello");
    const objectFn = sinon.stub().returns({ data: "test" });

    const memoizedNumber = createTimedMemoize(numberFn, 1000);
    const memoizedString = createTimedMemoize(stringFn, 1000);
    const memoizedObject = createTimedMemoize(objectFn, 1000);

    expect(memoizedNumber()).to.equal(42);
    expect(memoizedString()).to.equal("hello");
    expect(memoizedObject()).to.deep.equal({ data: "test" });
  });
});
