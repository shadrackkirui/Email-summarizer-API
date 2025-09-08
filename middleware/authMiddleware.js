import { createOAuth2Client } from "../utils/googleClient.js";

// Simple in-memory token store: sid -> { tokens }
export const tokenStore = new Map();

export function requireAuth(req, res, next) {
  const sid = req.cookies?.sid;
  if (!sid || !tokenStore.has(sid)) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export function getOAuthClientForRequest(req) {
  const sid = req.cookies?.sid;
  if (!sid) throw new Error("Missing session id");
  const entry = tokenStore.get(sid);
  if (!entry) throw new Error("No tokens for session");
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(entry.tokens);
  return oauth2Client;
}
