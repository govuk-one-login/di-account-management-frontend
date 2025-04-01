import {
  AnyMachineSnapshot,
  createActor,
  createMachine,
  getNextSnapshot,
  StateValue,
} from "xstate";

enum UserJourney {
  ChangeEmail = "changeEmail",
  ChangePassword = "changePassword",
  ChangePhoneNumber = "changePhoneNumber",
  ChangeAuthApp = "changeAuthApp",
  DeleteAccount = "deleteAccount",
  addBackup = "addBackup",
  RemoveMfaMethod = "removeMfaMethod",
  SwitchBackupMethod = "switchBackupMethod",
  ChangeDefaultMethod = "changeDefaultMethod",
}

enum EventType {
  Authenticated = "AUTHENTICATED",
  ValueUpdated = "VALUE_UPDATED",
  VerifyCodeSent = "VERIFY_CODE_SENT",
  SelectedApp = "SELECTED_APP",
  SelectedSms = "SELECTED_SMS",
  ResendCode = "RESEND_CODE",
  Confirmation = "CONFIRMATION",
  RemoveBackup = "REMOVE_BACKUP",
}

interface Event {
  type: EventType;
}

interface StateAction {
  value: StateValue;
  events: EventType[];
}

export const amStateMachine = createMachine({
  types: {
    context: {} as object,
    events: {} as Event,
  },
  context: {},
  id: "AM",
  initial: "AUTHENTICATE",
  states: {
    AUTHENTICATE: {
      on: {
        AUTHENTICATED: {
          target: "CHANGE_VALUE",
        },
      },
    },
    CHANGE_VALUE: {
      on: {
        VALUE_UPDATED: {
          target: "CONFIRMATION",
        },
        VERIFY_CODE_SENT: {
          target: "VERIFY_CODE",
        },
        SELECTED_APP: {
          target: "APP",
        },
        SELECTED_SMS: {
          target: "SMS",
        },
        REMOVE_BACKUP: {
          target: "CONFIRMATION",
        },
      },
    },
    CONFIRMATION: {
      type: "final",
    },
    VERIFY_CODE: {
      on: {
        VALUE_UPDATED: {
          target: "CONFIRMATION",
        },
        RESEND_CODE: {
          target: "CHANGE_VALUE",
        },
        VERIFY_CODE_SENT: {
          target: "CHANGE_VALUE",
        },
      },
    },
    APP: {
      on: {
        VALUE_UPDATED: {
          target: "CONFIRMATION",
        },
      },
    },
    SMS: {
      on: {
        VERIFY_CODE_SENT: {
          target: "VERIFY_CODE",
        },
      },
    },
  },
});

function getNextEvents(snapshot: AnyMachineSnapshot) {
  return [...new Set([...snapshot._nodes.flatMap((sn) => sn.ownEvents)])];
}

function getNextState(from: StateValue, to: EventType): StateAction {
  const t = getNextSnapshot(
    amStateMachine,
    amStateMachine.resolveState({ value: from, context: {} }),
    { type: to }
  );
  return {
    value: t.value,
    events: getNextEvents(t),
  };
}

function getInitialState(): StateAction {
  const actor = createActor(amStateMachine);
  const initialState = actor.getSnapshot();

  return {
    value: initialState.value,
    events: getNextEvents(initialState),
  };
}

export { UserJourney, EventType, StateAction, getNextState, getInitialState };
