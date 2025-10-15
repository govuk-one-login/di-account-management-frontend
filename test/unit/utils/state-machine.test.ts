import { expect } from "chai";
import { describe } from "mocha";
import {
  EventType,
  getInitialState,
  getNextState,
} from "../../../src/utils/state-machine";

describe("state-machine", () => {
  describe("getInitialState", () => {
    it("should get initial state object", () => {
      const state = getInitialState();

      expect(state.value).to.equal("AUTHENTICATE");
      expect(state.events).to.all.members([EventType.Authenticated]);
    });
  });

  describe("getNextState with code verification", () => {
    it("should move state from initial state to change value state", () => {
      const state = getInitialState();
      const nextState = getNextState(state.value, EventType.Authenticated);
      expect(nextState.value).to.equal("CHANGE_VALUE");
      expect(nextState.events).to.all.members([
        EventType.ValueUpdated,
        EventType.VerifyCodeSent,
        EventType.SelectedApp,
        EventType.SelectedSms,
        EventType.RemoveBackup,
      ]);
    });

    it("should move state from change value state to verify code state", () => {
      const nextState = getNextState("CHANGE_VALUE", EventType.VerifyCodeSent);
      expect(nextState.value).to.equal("VERIFY_CODE");
      expect(nextState.events).to.all.members([
        EventType.ValueUpdated,
        "RESEND_CODE",
        EventType.VerifyCodeSent,
      ]);
    });

    it("should move state from verify code state to value updated state", () => {
      const nextState = getNextState("VERIFY_CODE", EventType.ValueUpdated);
      expect(nextState.value).to.equal(EventType.Confirmation);
      expect(nextState.events).to.all.members([]);
    });

    it("should not allow getNext state to skip state", () => {
      const state = getInitialState();
      const nextState = getNextState(state.value, EventType.VerifyCodeSent);
      expect(nextState.value).to.equal("AUTHENTICATE");
      expect(nextState.events).to.all.members([EventType.Authenticated]);
    });
  });

  describe("getNextState without code verification", () => {
    it("should move state from initial state to change value state without code verification", () => {
      const state = getInitialState();
      const nextState = getNextState(state.value, EventType.Authenticated);
      expect(nextState.value).to.equal("CHANGE_VALUE");
      expect(nextState.events).to.all.members([
        EventType.ValueUpdated,
        EventType.VerifyCodeSent,
        EventType.SelectedApp,
        EventType.SelectedSms,
        EventType.RemoveBackup,
      ]);
    });

    it("should move state from   change value state to value updated state", () => {
      const nextState = getNextState("CHANGE_VALUE", EventType.ValueUpdated);
      expect(nextState.value).to.equal(EventType.Confirmation);
      expect(nextState.events).to.all.members([]);
    });
  });

  describe("getNextState for mfa process", () => {
    it("should move state from initial state to change value state when getting next state for mfa process", () => {
      const state = getInitialState();
      const nextState = getNextState(state.value, EventType.Authenticated);
      expect(nextState.value).to.equal("CHANGE_VALUE");
      expect(nextState.events).to.all.members([
        EventType.ValueUpdated,
        EventType.VerifyCodeSent,
        EventType.SelectedApp,
        EventType.SelectedSms,
        EventType.RemoveBackup,
      ]);
    });

    it("should move state from CHANGE_VALUE state to APP state when SELECTED_APP action event ", () => {
      const nextState = getNextState("CHANGE_VALUE", EventType.SelectedApp);
      expect(nextState.value).to.equal("APP");
      expect(nextState.events).to.all.members([
        EventType.ValueUpdated,
        EventType.GoBackToChooseBackup,
      ]);
    });

    it("should move state from CHANGE_VALUE state to SMS state when SELECTED_SMS action event ", () => {
      const nextState = getNextState("CHANGE_VALUE", EventType.SelectedSms);
      expect(nextState.value).to.equal("SMS");
      expect(nextState.events).to.all.members([
        EventType.VerifyCodeSent,
        EventType.GoBackToChooseBackup,
      ]);
    });

    it("should move state from APP state to CONFIRMATION state when VALUE_UPDATED action event ", () => {
      const nextState = getNextState("APP", EventType.ValueUpdated);
      expect(nextState.value).to.equal(EventType.Confirmation);
      expect(nextState.events).to.all.members([]);
    });

    it("should move state from APP state to CHANGE_VALUE state when GO_BACK_TO_CHOOSE_BACKUP action event ", () => {
      const nextState = getNextState("APP", EventType.GoBackToChooseBackup);
      expect(nextState.value).to.equal("CHANGE_VALUE");
      expect(nextState.events).to.all.members([
        EventType.ValueUpdated,
        EventType.VerifyCodeSent,
        EventType.SelectedApp,
        EventType.SelectedSms,
        EventType.RemoveBackup,
      ]);
    });

    it("should move state from SMS state to CHANGE_VALUE state when GO_BACK_TO_CHOOSE_BACKUP action event ", () => {
      const nextState = getNextState("SMS", EventType.GoBackToChooseBackup);
      expect(nextState.value).to.equal("CHANGE_VALUE");
      expect(nextState.events).to.all.members([
        EventType.ValueUpdated,
        EventType.VerifyCodeSent,
        EventType.SelectedApp,
        EventType.SelectedSms,
        EventType.RemoveBackup,
      ]);
    });
  });
});
