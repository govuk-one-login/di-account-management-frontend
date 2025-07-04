import { SetupServerApi } from "msw/lib/node";

export const monitorMswRequests = (server: SetupServerApi) => {
  type RequestEvent = {
    requestId: string;
    request: Request;
  };
  const requests: {
    handled: RequestEvent[];
    unhandled: RequestEvent[];
  } = {
    handled: [],
    unhandled: [],
  };
  server.events.on("request:match", ({ request, requestId }) => {
    requests.handled.push({ requestId, request });
  });
  server.events.on("request:unhandled", ({ request, requestId }) => {
    requests.unhandled.push({ requestId, request });
  });
  return requests;
};
