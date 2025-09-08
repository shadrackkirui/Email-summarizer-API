// Helpers to extract plain text content from Gmail API message payloads
function decodeBase64Url(data) {
  // Gmail returns base64url-encoded strings
  if (!data) return "";
  const replaced = data.replace(/-/g, "+").replace(/_/g, "/");
  const buff = Buffer.from(replaced, "base64");
  return buff.toString("utf-8");
}

function stripHtml(html) {
  if (!html) return "";
  // Remove tags & decode basic entities
  const text = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/?p>/gi, "\n")
    .replace(/<[^>]*>/g, "");
  return text;
}

function findPart(parts = [], mime) {
  for (const p of parts) {
    if (p.mimeType === mime) return p;
    if (p.parts) {
      const found = findPart(p.parts, mime);
      if (found) return found;
    }
  }
  return null;
}

export function extractTextFromMessage(payload) {
  if (!payload) return "";
  // Try text/plain first
  let part = null;
  if (payload.mimeType === "text/plain") {
    part = payload;
  } else if (payload.parts) {
    part = findPart(payload.parts, "text/plain");
  }
  if (part && part.body && part.body.data) {
    return decodeBase64Url(part.body.data);
  }

  // Fallback to text/html
  if (payload.mimeType === "text/html") {
    return stripHtml(decodeBase64Url(payload.body?.data));
  }
  const htmlPart = payload.parts ? findPart(payload.parts, "text/html") : null;
  if (htmlPart && htmlPart.body && htmlPart.body.data) {
    return stripHtml(decodeBase64Url(htmlPart.body.data));
  }

  // Fallback: if body.data exists on the root
  if (payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }

  return "";
}

export function headerValue(headers = [], name) {
  const h = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : "";
}
