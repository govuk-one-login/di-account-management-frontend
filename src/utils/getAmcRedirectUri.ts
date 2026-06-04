import { getAmcCallbackBaseUrl } from "../config.js";
import { PATH_DATA } from "../app.constants.js";

export const getAmcRedirectUri = (scope: string) => {
  const redirectUri = `${getAmcCallbackBaseUrl()}${PATH_DATA.AMC_CALLBACK.url}`;
  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.set("scope", scope);

  return redirectUrl.toString();
};
