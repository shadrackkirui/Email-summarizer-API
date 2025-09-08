import axios from "axios";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "models/gemini-1.5-flash:generateContent";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY is not set.");
}

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 20000
});

function buildFewShotPrompt(emailText) {
  const template = `You are an assistant that summarizes emails into 3 clear bullet points.
Always keep the summary concise and factual. Do not add information not found in the email.

Example 1:
Email:
"Hi John, just reminding you about tomorrow’s 10am project meeting at the office. Bring the sales report."
Summary:
- Reminder of project meeting tomorrow at 10am.
- Location: office.
- Bring the sales report.

Example 2:
Email:
"Dear team, the server maintenance will occur this Saturday night. Expect downtime from 10pm to 2am."
Summary:
- Server maintenance scheduled for Saturday night.
- Downtime: 10pm to 2am.
- Service may be unavailable during this period.

Now summarize this email in 3 bullet points:
Email:
"${emailText}"
Summary:`;
  return template;
}

export async function summarizeEmail(text) {
  const prompt = buildFewShotPrompt(text);
  const url = `/${MODEL}?key=${encodeURIComponent(apiKey)}`;
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
  };
  const res = await client.post(url, payload, {
    headers: { "Content-Type": "application/json" }
  });
  // Parse response into an array of bullet points
  const raw =
    res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    res.data?.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data ||
    "";
  const lines = raw
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);
  const bullets = [];
  for (const line of lines) {
    if (line.startsWith("- ")) bullets.push(line.slice(2).trim());
    else if (line.startswith("•")) bullets.push(line.replace(/^•\s*/, ""));
  }
  if (bullets.length === 0 && raw) {
    bullets.push(raw);
  }
  return bullets.slice(0, 3);
}
