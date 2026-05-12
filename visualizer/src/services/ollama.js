const OLLAMA_BASE = "http://localhost:11434";
const MODEL = "gemma4:e2b";

/**
 * Convert our internal message format to what Ollama expects.
 * Our format: { role, text, images?: string[] (base64 data URLs) }
 * Ollama format: { role, content: string | Array<{type,text}|{type,image_url,...}> }
 */
function toOllamaMessage(msg) {
  // If no images, just send plain text
  if (!msg.images || msg.images.length === 0) {
    return { role: msg.role, content: msg.text };
  }
  // Multimodal: array of content parts
  const parts = [];
  for (const dataUrl of msg.images) {
    // Ollama expects base64 string without the data:... prefix for the `images` field
    // but also supports the OpenAI-style content array for vision models
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    parts.push({ type: "image_url", image_url: { url: `data:image/png;base64,${base64}` } });
  }
  if (msg.text) {
    parts.push({ type: "text", text: msg.text });
  }
  return { role: msg.role, content: parts };
}

/**
 * Stream a chat completion from Ollama.
 * Yields token delta strings as they arrive.
 *
 * @param {Array<{role:string, text:string, images?:string[]}>} messages
 * @returns {AsyncGenerator<string>}
 */
export async function* streamChat(messages) {
  const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: messages.map(toOllamaMessage),
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API error ${response.status}: ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep incomplete last line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const json = JSON.parse(trimmed);
        const delta = json?.message?.content;
        if (delta) yield delta;
        if (json?.done) return;
      } catch {
        // skip malformed lines
      }
    }
  }
}

/**
 * Check if Ollama is reachable.
 * @returns {Promise<boolean>}
 */
export async function checkOllamaHealth() {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
