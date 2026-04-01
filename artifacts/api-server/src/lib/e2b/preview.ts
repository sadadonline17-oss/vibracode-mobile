import { Sandbox } from 'e2b';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

const DEV_PORTS = [3000, 5173, 8080, 8081, 4321, 4000, 8000, 1234, 3001, 4096];

export async function waitForDevServer(
  sandbox: Sandbox,
  timeoutMs = 60_000
): Promise<{ url: string; port: number } | null> {

  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    for (const port of DEV_PORTS) {
      try {
        const host = sandbox.getHost(port);
        const url  = `https://${host}`;
        const res  = await fetch(url, { signal: AbortSignal.timeout(2000) });
        if (res.ok || res.status === 101 || res.status === 304) {
          return { url, port };
        }
      } catch { }
    }

    try {
      const lsof = await sandbox.commands.run(
        `lsof -i -P -n 2>/dev/null | grep LISTEN | awk '{print $9}' | grep -oP ':[0-9]+$' | tr -d ':' | sort -u`
      );
      const listenPorts = lsof.stdout
        .split('\n')
        .map(p => parseInt(p.trim()))
        .filter(p => !isNaN(p) && p > 1000 && p < 65000);

      for (const port of listenPorts) {
        if (DEV_PORTS.includes(port)) continue;
        try {
          const host = sandbox.getHost(port);
          const url  = `https://${host}`;
          const res  = await fetch(url, { signal: AbortSignal.timeout(2000) });
          if (res.ok || res.status === 101) {
            return { url, port };
          }
        } catch { }
      }
    } catch { }

    await new Promise(r => setTimeout(r, 2000));
  }

  return null;
}

export async function publishPreview(
  sandbox: Sandbox,
  sessionId: string
): Promise<string | null> {

  const preview = await waitForDevServer(sandbox);
  if (!preview) return null;

  try {
    await convex.mutation(api.sessions.setPreview, {
      sessionId: sessionId as any,
      previewUrl: preview.url,
    });

    await convex.mutation(api.messages.send, {
      sessionId: sessionId as any,
      role:    'assistant',
      type:    'preview',
      content: preview.url,
      metadata: { port: preview.port },
    });
  } catch (err) {
    console.error('[preview] Convex publish failed:', err);
  }

  return preview.url;
}

export async function runPlaywrightTest(
  sandbox: Sandbox,
  sessionId: string,
  testFile: string
): Promise<void> {
  const result = await sandbox.commands.run(
    `cd /home/user/project && npx playwright test ${testFile} --reporter=json 2>&1`,
    {
      onStdout: async (data) => {
        await convex.mutation(api.messages.send, {
          sessionId: sessionId as any,
          role: 'assistant', type: 'bash', content: data,
        }).catch(() => {});
      },
    }
  );

  try {
    const report = JSON.parse(result.stdout);
    const passed = report.suites?.flatMap((s: any) => s.specs).filter((s: any) => s.ok).length ?? 0;
    const failed = report.suites?.flatMap((s: any) => s.specs).filter((s: any) => !s.ok).length ?? 0;
    await convex.mutation(api.messages.send, {
      sessionId: sessionId as any,
      role: 'assistant', type: 'status',
      content: `🧪 Tests: ${passed} passed, ${failed} failed`,
    });
  } catch { }
}
