import { OAuth2Client } from "@badgateway/oauth2-client";

export const oauthClient = new OAuth2Client({
  // TODO: add client id here
  clientId: "dub_app_39527dcc11b452f38bb54a3a1664fd044d7158dfea8abcde",
  authorizationEndpoint: "https://app.pimms.io/oauth/authorize",
  tokenEndpoint: "https://app.pimms.io/oauth/token",
});
