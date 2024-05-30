import { createMachine, EventType, StateValue } from "xstate";

enum UserJourney {
  ChangeEmail = "changeEmail",
  ChangePassword = "changePassword",
  ChangePhoneNumber = "changePhoneNumber",
  ChangeAuthenticatorApp = "changeAuthenticatorApp",
  DeleteAccount = "deleteAccount",
  AddMfaMethod = "addMfaMethod",
}

type AccountManagementEvent =
  | "VALUE_UPDATED"
  | "VERIFY_CODE_SENT"
  | "AUTHENTICATED"
  | "RESEND_CODE"
  | "SELECTED_APP"
  | "SELECTED_SMS";

interface StateAction {
  value: StateValue;
  events: EventType[];
}

const amStateMachine = createMachine<AccountManagementEvent>({
  id: "AM",
  initial: "AUTHENTICATE",
  states: {
    AUTHENTICATE: {
      on: {
        AUTHENTICATED: "CHANGE_VALUE",
      },
    },
    CHANGE_VALUE: {
      on: {
        VALUE_UPDATED: "CONFIRMATION",
        VERIFY_CODE_SENT: "VERIFY_CODE",
        SELECTED_APP: "APP",
        SELECTED_SMS: "SMS",
      },
    },
    APP: {
      on: {
        VALUE_UPDATED: "CONFIRMATION",
      },
    },
    SMS: {
      on: {
        VALUE_UPDATED: "CONFIRMATION",
      },
    },
    VERIFY_CODE: {
      on: {
        VALUE_UPDATED: "CONFIRMATION",
        RESEND_CODE: "CHANGE_VALUE",
        VERIFY_CODE_SENT: "CHANGE_VALUE",
      },
    },
    CONFIRMATION: { type: "final" },
  },
  predictableActionArguments: true,
});

function getNextState(
  from: StateValue,
  to: AccountManagementEvent
): StateAction {
  const t = amStateMachine.transition(from, to);
  return {
    value: t.value,
    events: t.nextEvents,
  };
}

function getInitialState(): StateAction {
  return {
    value: amStateMachine.initialState.value,
    events: amStateMachine.initialState.nextEvents,
  };
}

function canTransition(
  currentState: StateValue,
  event: AccountManagementEvent
): boolean {
  return !!amStateMachine.transition(currentState, event).changed;
}

export {
  getNextState,
  canTransition,
  UserJourney,
  getInitialState,
  StateAction,
  AccountManagementEvent,
};
