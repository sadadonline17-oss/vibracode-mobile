import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CONFIG } from "../config";

interface SettingsState {
  openrouterKey: string;
  geminiKey: string;
  anthropicKey: string;
  openaiKey: string;
  mistralKey: string;
  groqKey: string;
  cohereKey: string;
  togetherKey: string;
}

interface SettingsContextValue extends SettingsState {
  setOpenrouterKey: (key: string) => void;
  setGeminiKey: (key: string) => void;
  setAnthropicKey: (key: string) => void;
  setOpenaiKey: (key: string) => void;
  setMistralKey: (key: string) => void;
  setGroqKey: (key: string) => void;
  setCohereKey: (key: string) => void;
  setTogetherKey: (key: string) => void;
  resetKeys: () => void;
  getEffectiveOpenrouterKey: () => string;
  getEffectiveGeminiKey: () => string;
}

const DEFAULTS: SettingsState = {
  openrouterKey: "",
  geminiKey: "",
  anthropicKey: "",
  openaiKey: "",
  mistralKey: "",
  groqKey: "",
  cohereKey: "",
  togetherKey: "",
};

const SettingsContext = createContext<SettingsContextValue | null>(null);
const SETTINGS_KEY = "vibracode_settings_v2";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SettingsState>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const saved: Partial<SettingsState> = JSON.parse(raw);
            setState((prev) => ({ ...prev, ...saved }));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback((next: SettingsState) => {
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  function makeSetter<K extends keyof SettingsState>(key: K) {
    return (value: string) => {
      setState((prev) => {
        const next = { ...prev, [key]: value };
        persist(next);
        return next;
      });
    };
  }

  const resetKeys = useCallback(() => {
    setState(DEFAULTS);
    persist(DEFAULTS);
  }, [persist]);

  const getEffectiveOpenrouterKey = useCallback(
    () => state.openrouterKey.trim() || CONFIG.OPENROUTER_API_KEY,
    [state.openrouterKey]
  );

  const getEffectiveGeminiKey = useCallback(
    () => state.geminiKey.trim() || CONFIG.GEMINI_API_KEY,
    [state.geminiKey]
  );

  if (!loaded) return null;

  return (
    <SettingsContext.Provider
      value={{
        ...state,
        setOpenrouterKey: makeSetter("openrouterKey"),
        setGeminiKey: makeSetter("geminiKey"),
        setAnthropicKey: makeSetter("anthropicKey"),
        setOpenaiKey: makeSetter("openaiKey"),
        setMistralKey: makeSetter("mistralKey"),
        setGroqKey: makeSetter("groqKey"),
        setCohereKey: makeSetter("cohereKey"),
        setTogetherKey: makeSetter("togetherKey"),
        resetKeys,
        getEffectiveOpenrouterKey,
        getEffectiveGeminiKey,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}
