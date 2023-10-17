export interface TxMaEventServiceInterface {
  send: (
    data: TxmaEvent,
  ) => void;
}

export interface TxmaEvent {
  timestamp: number;
  event_name: string;
  component_id: string;
  user: User;
  platform: Platform;
  extensions: Extensions;
}

export interface User {
  session_id: string;
  persistent_session_id: string;
}

export interface Platform {
  user_agent: string;
}

export interface Extensions {
  from_url: string;
  app_session_id: string;
  app_error_code: string;
  reference_code: string;
}