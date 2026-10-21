
const ALLOWED_ORIGIN = "https://Swarnadeep23082011.github.io";
const MODEL = "@cf/zai-org/glm-4.7-flash";

const SYSTEM_INSTRUCTIONS = `
You are SUPER DEEP AI, created by developer Swarnadeep Kha.
PUMPKIN BASH is a fictional model label, not the actual model name.
Use fluent, polished English. Be logical, friendly, professional,
cheerful, and occasionally witty. Use emojis rarely.
Explain complex topics clearly, admit uncertainty, and never invent facts.
Give detailed answers when useful and concise answers for simple questions.
Treat serious topics respectfully. Follow applicable safety requirements.
You are a text-only assistant.
`;

function jsonResponse(data, status, origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  };

  if (origin === ALLOWED_ORIGIN) {
    headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN;
  }

  return new Response(JSON.stringify(data), { status, headers });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (origin && origin !== ALLOWED_ORIGIN) {
      return jsonResponse({ error: "Origin not allowed." }, 403, "");
    }

    if (request.method === "OPTIONS") {
      if (origin !== ALLOWED_ORIGIN) {
        return jsonResponse({ error: "Origin not allowed." }, 403, "");
      }

      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Use POST to send a chat message." }, 405, origin);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON request." }, 400, origin);
    }

    const message = typeof body.message === "string"
      ? body.message.trim()
      : "";

    if (!message) {
      return jsonResponse({ error: "Please enter a message." }, 400, origin);
    }

    if (message.length > 4000) {
      return jsonResponse({ error: "Messages must be under 4,000 characters." }, 413, origin);
    }

    try {
      const result = await env.AI.run(MODEL, {
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTIONS },
          { role: "user", content: message }
        ],
        max_tokens: 900,
        temperature: 0.7
      });

      const reply = typeof result?.response === "string"
        ? result.response.trim()
        : "";

      if (!reply) {
        return jsonResponse({ error: "The AI returned no answer. Please try again." }, 502, origin);
      }

      return jsonResponse({ reply }, 200, origin);
    } catch (error) {
      console.error("AI request failed:", error);
      return jsonResponse({
        error: "The AI service is temporarily unavailable. Please try again later."
      }, 502, origin);
    }
  }
};
