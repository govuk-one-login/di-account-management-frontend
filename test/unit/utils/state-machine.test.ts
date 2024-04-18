import { expect } from "chai";
import { describe } from "mocha";
import {
  getInitialState,
  getNextState,
} from "../../../src/utils/state-machine";

describe("state-machine", () => {
  describe("getInitialState", () => {
    it("should get initial state object", () => {
      const state = getInitialState();

      expect(state.value).to.equal("AUTHENTICATE");
      expect(state.events).to.all.members(["AUTHENTICATED"]);
    });
  });

  describe("getNextState with code verification", () => {
    it("should move state from initial state to change value state", () => {
      const state = getInitialState();
      const nextState = getNextState(state.value, "AUTHENTICATED");
      expect(nextState.value).to.equal("CHANGE_VALUE");
      expect(nextState.events).to.all.members([
        "VALUE_UPDATED",
        "VERIFY_CODE_SENT",
        "SELECTED_APP",
        "SELECTED_SMS",
      ]);
    });

    it("should move state from change value state to verify code state", () => {
      const nextState = getNextState("CHANGE_VALUE", "VERIFY_CODE_SENT");
      expect(nextState.value).to.equal("VERIFY_CODE");
      expect(nextState.events).to.all.members([
        "VALUE_UPDATED",
        "RESEND_CODE",
        "VERIFY_CODE_SENT",
      ]);
    });

    it("should move state from verify code state to value updated state", () => {
      const nextState = getNextState("VERIFY_CODE", "VALUE_UPDATED");
      expect(nextState.value).to.equal("CONFIRMATION");
      expect(nextState.events).to.all.members([]);
    });

    it("should not allow getNext state to skip state", () => {
      const state = getInitialState();
      const nextState = getNextState(state.value, "VERIFY_CODE_SENT");
      expect(nextState.value).to.equal("AUTHENTICATE");
      expect(nextState.events).to.all.members(["AUTHENTICATED"]);
    });
  });

  describe("getNextState without code verification", () => {
    it("should move state from initial state to change value state", () => {
      const state = getInitialState();
      const nextState = getNextState(state.value, "AUTHENTICATED");
      expect(nextState.value).to.equal("CHANGE_VALUE");
      expect(nextState.events).to.all.members([
        "VALUE_UPDATED",
        "VERIFY_CODE_SENT",
        "SELECTED_APP",
        "SELECTED_SMS",
      ]);
    });

    it("should move state from   change value state to value updated state", () => {
      const nextState = getNextState("CHANGE_VALUE", "VALUE_UPDATED");
      expect(nextState.value).to.equal("CONFIRMATION");
      expect(nextState.events).to.all.members([]);
    });
  });

  describe("getNextState for mfa process", () => {
    it("should move state from initial state to change value state", () => {
      const state = getInitialState();
      const nextState = getNextState(state.value, "AUTHENTICATED");
      expect(nextState.value).to.equal("CHANGE_VALUE");
      expect(nextState.events).to.all.members([
        "VALUE_UPDATED",
        "VERIFY_CODE_SENT",
        "SELECTED_APP",
        "SELECTED_SMS",
      ]);
    });

    it("should move state from CHANGE_VALUE state to APP state when SELECTED_APP action event ", () => {
      const nextState = getNextState("CHANGE_VALUE", "SELECTED_APP");
      expect(nextState.value).to.equal("APP");
      expect(nextState.events).to.all.members(["VALUE_UPDATED"]);
    });

    it("should move state from CHANGE_VALUE state to SMS state when SELECTED_SMS action event ", () => {
      const nextState = getNextState("CHANGE_VALUE", "SELECTED_SMS");
      expect(nextState.value).to.equal("SMS");
      expect(nextState.events).to.all.members(["VALUE_UPDATED"]);
    });

    it("should move state from APP state to CONFIRMATION state when VALUE_UPDATED action event ", () => {
      const nextState = getNextState("APP", "VALUE_UPDATED");
      expect(nextState.value).to.equal("CONFIRMATION");
      expect(nextState.events).to.all.members([]);
    });
  });
});
