type TerminalOutputType = "output" | "error" | "agent";
type TerminalListener = (text: string, type: TerminalOutputType) => void;

const _listeners: Set<TerminalListener> = new Set();

export const terminalBridge = {
  emit(text: string, type: TerminalOutputType = "output"): void {
    _listeners.forEach((fn) => {
      try { fn(text, type); } catch {}
    });
  },

  subscribe(fn: TerminalListener): () => void {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};
