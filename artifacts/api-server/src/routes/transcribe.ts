import { Router, Request, Response } from "express";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const router = Router();

const GROQ_BASE = "https://api.groq.com/openai/v1";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

const DEFAULT_GROQ_KEY = process.env.GROQ_API_KEY ?? "";
const DEFAULT_OR_KEY =
  process.env.OPENROUTER_API_KEY ??
  "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";

// POST /api/transcribe
// Body: { audio: string (base64), mimeType?: string, groqKey?: string, openrouterKey?: string }
// Returns: { text: string }
router.post("/", async (req: Request, res: Response) => {
  const { audio, mimeType = "audio/m4a", groqKey, openrouterKey } = req.body as {
    audio: string;
    mimeType?: string;
    groqKey?: string;
    openrouterKey?: string;
  };

  if (!audio) {
    res.status(400).json({ error: "audio (base64) is required" });
    return;
  }

  const effectiveGroqKey =
    groqKey?.trim().startsWith("gsk_") ? groqKey.trim() : DEFAULT_GROQ_KEY;

  // Determine file extension from mimeType
  const ext = mimeType.includes("mp4")
    ? ".mp4"
    : mimeType.includes("mpeg") || mimeType.includes("mp3")
    ? ".mp3"
    : mimeType.includes("webm")
    ? ".webm"
    : mimeType.includes("ogg")
    ? ".ogg"
    : mimeType.includes("wav")
    ? ".wav"
    : ".m4a";

  const tmpPath = join(tmpdir(), `vibra_audio_${Date.now()}${ext}`);

  try {
    // Write base64 audio to temp file
    const buffer = Buffer.from(audio, "base64");
    writeFileSync(tmpPath, buffer);

    // Try Groq first if we have a key
    if (effectiveGroqKey) {
      const formData = new FormData();
      const blob = new Blob([buffer], { type: mimeType });
      formData.append("file", blob, `audio${ext}`);
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("response_format", "json");
      formData.append("language", "ar");

      const groqRes = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${effectiveGroqKey}`,
        },
        body: formData,
      });

      if (groqRes.ok) {
        const data = (await groqRes.json()) as { text: string };
        res.json({ text: data.text, provider: "groq" });
        return;
      }
    }

    // Fallback: Try OpenRouter Whisper
    const orKey = openrouterKey?.trim() || DEFAULT_OR_KEY;
    const formData2 = new FormData();
    const blob2 = new Blob([buffer], { type: mimeType });
    formData2.append("file", blob2, `audio${ext}`);
    formData2.append("model", "openai/whisper-1");

    const orRes = await fetch(`${OPENROUTER_BASE}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${orKey}`,
        "HTTP-Referer": "https://vibracode.app",
        "X-Title": "Vibra Code",
      },
      body: formData2,
    });

    if (orRes.ok) {
      const data2 = (await orRes.json()) as { text: string };
      res.json({ text: data2.text, provider: "openrouter" });
      return;
    }

    res.status(500).json({ error: "Transcription failed: no available provider" });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Transcription error" });
  } finally {
    try {
      unlinkSync(tmpPath);
    } catch {}
  }
});

export default router;
