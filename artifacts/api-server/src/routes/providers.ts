import { Router, Request, Response } from 'express';
import { ConvexHttpClient } from 'convex/browser';
import { testCustomProvider, ProviderConfig } from '../lib/providers/registry';

const router = Router();

const convex = new ConvexHttpClient(
  process.env.CONVEX_URL ?? 'https://astute-ladybug-398.convex.cloud'
);

router.post('/', async (req: Request, res: Response) => {
  const body = req.body as Record<string, any>;
  const { action, userId } = body;

  switch (action) {
    case 'add': {
      const { name, type, baseUrl, apiKey, models } = body;
      const test = await testCustomProvider({ type, baseUrl, apiKey, model: models[0] } as ProviderConfig);
      const id = await convex.mutation('providers:add' as any, {
        userId, name, type, baseUrl, apiKey, models,
        testStatus: test.ok ? 'ok' : 'error',
      });
      res.json({ ok: true, id, testStatus: test.ok ? 'ok' : 'error' });
      return;
    }
    case 'delete': {
      await convex.mutation('providers:remove' as any, { providerId: body.providerId });
      res.json({ ok: true });
      return;
    }
    case 'test': {
      const { baseUrl, type, apiKey, model } = body;
      const result = await testCustomProvider({ type, baseUrl, apiKey, model } as ProviderConfig);
      res.json(result);
      return;
    }
    case 'list_ollama': {
      try {
        const r = await fetch(`${body.baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
        const data = await r.json() as { models?: Array<{ name: string }> };
        res.json({ ok: true, models: (data.models ?? []).map((m) => m.name) });
      } catch (err) {
        res.json({ ok: false, error: String(err), models: [] });
      }
      return;
    }
    default:
      res.status(400).json({ error: 'unknown action' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  const userId = (req.query.userId as string) ?? '';
  const providers = await convex.query('providers:listByUser' as any, { userId });
  res.json({ providers });
});

export default router;
