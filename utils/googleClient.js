import { google } from "googleapis";

export const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly"
];

export function createOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google OAuth env vars (GOOGLE_CLIENT_ID/SECRET, OAUTH_REDIRECT_URI).");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function gmailClient(oauth2Client) {
  return google.gmail({ version: "v1", auth: oauth2Client });
}
