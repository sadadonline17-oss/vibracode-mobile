import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { action, baseUrl, model } = req.body as {
    action: string;
    baseUrl?: string;
    model?: string;
  };
  const url = baseUrl ?? process.env.OLLAMA_URL ?? 'http://localhost:11434';

  switch (action) {
    case 'list_models': {
      try {
        const r = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) });
        const data = await r.json() as { models: Array<{ name: string }> };
        res.json({ ok: true, models: (data.models ?? []).map(m => m.name) });
      } catch (err) {
        res.json({ ok: false, error: String(err) });
      }
      return;
    }
    case 'pull_model': {
      try {
        const r = await fetch(`${url}/api/pull`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: model, stream: false }),
          signal: AbortSignal.timeout(300_000),
        });
        res.json({ ok: r.ok });
      } catch (err) {
        res.json({ ok: false, error: String(err) });
      }
      return;
    }
    case 'test': {
      try {
        const r = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(3000) });
        res.json({ ok: r.ok });
      } catch {
        res.json({ ok: false });
      }
      return;
    }
    case 'chat': {
      try {
        const r = await fetch(`${url}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: req.body.message ?? '' }],
            stream: false,
          }),
        });
        const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
        res.json({ ok: true, content: d.choices?.[0]?.message?.content });
      } catch (err) {
        res.json({ ok: false, error: String(err) });
      }
      return;
    }
    default:
      res.status(400).json({ error: 'unknown action' });
  }
});

export default router;
