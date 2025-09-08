import express from "express";
import { getOAuthClientForRequest, requireAuth } from "../middleware/authMiddleware.js";
import { gmailClient } from "../utils/googleClient.js";
import { extractTextFromMessage, headerValue } from "../utils/emailParser.js";
import { summarizeEmail } from "../utils/geminiClient.js";

const router = express.Router();

router.get("/summaries", requireAuth, async (req, res) => {
  try {
    const maxEmails = parseInt(process.env.MAX_EMAILS || "10", 10);
    const oauth2Client = getOAuthClientForRequest(req);
    const gmail = gmailClient(oauth2Client);

    // List unread emails (limit via maxResults)
    const listResp = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread newer_than:30d",
      maxResults: maxEmails
    });

    const messages = listResp.data.messages || [];
    const results = [];
    for (const m of messages) {
      const msgResp = await gmail.users.messages.get({
        userId: "me",
        id: m.id,
        format: "full"
      });
      const msg = msgResp.data;
      const headers = msg.payload?.headers || [];
      const subject = headerValue(headers, "Subject") || "(no subject)";
      const from = headerValue(headers, "From") || "";
      const date = headerValue(headers, "Date") || "";
      const snippet = msg.snippet || "";
      const bodyText = extractTextFromMessage(msg.payload) || snippet;

      // Summarize with Gemini
      const summary = await summarizeEmail(bodyText);

      results.push({
        id: msg.id,
        threadId: msg.threadId,
        subject,
        from,
        date,
        snippet,
        summary,
        gmailLink: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`
      });
    }

    res.json({ count: results.length, items: results });
  } catch (err) {
    console.error(err?.response?.data || err);
    res.status(500).json({ error: "Failed to fetch summaries" });
  }
});

export default router;
