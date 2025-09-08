import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import summaryRoutes from "./routes/summary.js";

dotenv.config();

const app = express();

// Basic health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// CORS
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// Routes
app.use("/auth", authRoutes);
app.use("/", summaryRoutes);

// Root
app.get("/", (_req, res) => res.send("AI Email Summarizer Backend is running."));

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
