export interface EventServiceInterface {
  send: (data: Event) => void;
}

export interface Event {
  event_name: string;
}

export interface AuditEvent extends Event {
  timestamp: number;
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
