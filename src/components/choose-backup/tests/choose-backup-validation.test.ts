import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { validateChooseBackupRequest } from "../choose-backup-validation";
import { SinonSpy } from "sinon";

describe("validateaddBackupRequest", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let nextSpy: SinonSpy;

  beforeEach(() => {
    req = {
      body: {},
      session: {} as any,
      t: sinon.stub().returns("Error message"),
    };
    res = {
      render: sinon.stub(),
    };
    nextSpy = sinon.spy();
    next = nextSpy;
  });

  it("should return an array with two middleware functions", () => {
    const middlewareArray = validateChooseBackupRequest();
    expect(middlewareArray).to.be.an("array").with.lengthOf(2);
    expect(middlewareArray[0]).to.be.a("function");
    expect(middlewareArray[1]).to.be.a("function");
  });

  it("should validate 'addBackup' field is not empty", async () => {
    const [validationMiddleware] = validateChooseBackupRequest();
    req.body.addBackup = ""; // Simulate an empty input

    await (validationMiddleware as any)(req, res, next);

    const errors = validationResult(req as Request);
    expect(errors.isEmpty()).to.be.false;
    expect(errors.array()[0].msg).to.equal("Error message");
  });

  it("should call next() if no validation errors", () => {
    const [, handleValidationErrors] = validateChooseBackupRequest();

    handleValidationErrors(req as Request, res as Response, next);

    expect(nextSpy).to.have.been.calledOnce;
  });
});
