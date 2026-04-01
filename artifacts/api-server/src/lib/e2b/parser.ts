import { AgentId } from './agents';

export interface ParsedEvent {
  type: 'message' | 'tasks_card' | 'read_file' | 'edit_file' | 'bash' | 'status' | 'preview' | 'error';
  content: string;
}

export function parseLine(line: string, agent: AgentId): ParsedEvent | null {
  if (!line.trim()) return null;

  // ── Claude Code & KiloCode: stream-json ─────────────────────────────────
  if (agent === 'claude' || agent === 'kilocode') {
    try {
      const e = JSON.parse(line);
      if (e.type === 'assistant') {
        for (const block of e.message?.content ?? []) {
          if (block.type === 'text' && block.text)
            return { type: 'message', content: block.text };
          if (block.type === 'tool_use') {
            switch (block.name) {
              case 'Read':      return { type: 'read_file',  content: block.input?.file_path ?? '' };
              case 'Write':
              case 'Edit':      return { type: 'edit_file',  content: block.input?.file_path ?? '' };
              case 'Bash':      return { type: 'bash',        content: block.input?.command ?? '' };
              case 'TodoWrite': return { type: 'tasks_card', content: JSON.stringify(block.input) };
            }
          }
        }
      }
      if (e.type === 'result') return { type: 'status',  content: `✅ Done (${e.duration_ms ?? 0}ms)` };
      if (e.type === 'error')  return { type: 'error',   content: e.error ?? line };
      return null;
    } catch { /* fall through */ }
  }

  // ── Codex: json-lines ────────────────────────────────────────────────────
  if (agent === 'codex') {
    try {
      const e = JSON.parse(line);
      if (e.type === 'message')   return { type: 'message',  content: e.content ?? '' };
      if (e.type === 'tool_call') {
        if (e.name === 'shell')                              return { type: 'bash',      content: e.parameters?.command ?? '' };
        if (e.name === 'write_file' || e.name === 'apply_patch') return { type: 'edit_file', content: e.parameters?.path ?? '' };
        if (e.name === 'read_file')                          return { type: 'read_file', content: e.parameters?.path ?? '' };
      }
      if (e.type === 'done')      return { type: 'status',   content: '✅ Done' };
      return null;
    } catch { /* fall through */ }
  }

  // ── Amp: amp-json ────────────────────────────────────────────────────────
  if (agent === 'amp') {
    try {
      const e = JSON.parse(line);
      if (e.type === 'text')    return { type: 'message',  content: e.content ?? '' };
      if (e.type === 'command') return { type: 'bash',      content: e.command ?? '' };
      if (e.type === 'file')    return { type: 'edit_file', content: e.path ?? '' };
      if (e.type === 'read')    return { type: 'read_file', content: e.path ?? '' };
      if (e.type === 'tasks')   return { type: 'tasks_card', content: JSON.stringify(e.tasks ?? []) };
      if (e.type === 'done')    return { type: 'status',    content: '✅ Amp finished' };
      return null;
    } catch { /* fall through */ }
  }

  // ── Plain text: opencode, junie, openclaw ────────────────────────────────
  return { type: 'bash', content: line };
}
