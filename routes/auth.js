import express from "express";
import { v4 as uuidv4 } from "uuid";
import { createOAuth2Client, SCOPES } from "../utils/googleClient.js";
import { tokenStore } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/google", async (req, res) => {
  try {
    const oauth2Client = createOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES
    });
    res.redirect(url);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start Google OAuth" });
  }
});

router.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send("Missing code");
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    // Create a session id and store tokens in memory
    const sid = uuidv4();
    tokenStore.set(sid, { tokens });
    // Set httpOnly cookie for session
    res.cookie("sid", sid, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    });
    // Redirect back to frontend
    const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
    res.redirect(FRONTEND_ORIGIN + "/");
  } catch (err) {
    console.error(err);
    res.status(500).send("OAuth callback error");
  }
});

router.post("/logout", (req, res) => {
  try {
    const sid = req.cookies?.sid;
    if (sid) tokenStore.delete(sid);
    res.clearCookie("sid", { httpOnly: true, sameSite: "none", secure: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Logout failed" });
  }
});

export default router;
