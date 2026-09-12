import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-3.6-flash";

export type GeminiMessage = {
  role: "user" | "assistant";
  content: string;
};

const REQUEST_TIMEOUT_MS = 30_000;

export class GeminiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiError";
  }
}

export async function generateAssistantReply(
  history: GeminiMessage[],
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in the server environment");
    throw new GeminiError(
      "Gemini is not configured. Add GEMINI_API_KEY to the server environment.",
    );
  }

  const contents = history.map((entry) => ({
    role: entry.role === "assistant" ? "model" : "user",
    parts: [{ text: entry.content }],
  }));

  const ai = new GoogleGenAI({ apiKey });

  let response;
  try {
    response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    });
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError");
    if (isTimeout) {
      throw new GeminiError(
        "Gemini is taking too long to respond. Please try again.",
      );
    }
    const status = (err as { status?: number }).status;
    const detail = err instanceof Error ? err.message : String(err);
    if (status === 429 || /rate limit|quota|429/i.test(detail)) {
      throw new GeminiError(
        "Gemini rate limit reached. Please wait a moment and try again.",
      );
    }
    console.error("Gemini request failed:", detail);
    throw new GeminiError(
      "Gemini could not generate a response. Please try again.",
    );
  }

  const text = response.text?.trim();
  if (!text) {
    throw new GeminiError(
      "Gemini returned an empty response. Please try again.",
    );
  }
  return text;
}