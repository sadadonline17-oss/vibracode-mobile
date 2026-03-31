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
}

interface SettingsContextValue {
  openrouterKey: string;
  geminiKey: string;
  setOpenrouterKey: (key: string) => void;
  setGeminiKey: (key: string) => void;
  resetKeys: () => void;
  getEffectiveOpenrouterKey: () => string;
  getEffectiveGeminiKey: () => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);
const SETTINGS_KEY = "vibracode_settings_v1";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [openrouterKey, setOpenrouterKeyState] = useState("");
  const [geminiKey, setGeminiKeyState] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const saved: Partial<SettingsState> = JSON.parse(raw);
            if (saved.openrouterKey) setOpenrouterKeyState(saved.openrouterKey);
            if (saved.geminiKey) setGeminiKeyState(saved.geminiKey);
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = useCallback(
    (patch: Partial<SettingsState>) => {
      const next: SettingsState = {
        openrouterKey,
        geminiKey,
        ...patch,
      };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
    },
    [openrouterKey, geminiKey]
  );

  const setOpenrouterKey = useCallback(
    (key: string) => {
      setOpenrouterKeyState(key);
      save({ openrouterKey: key });
    },
    [save]
  );

  const setGeminiKey = useCallback(
    (key: string) => {
      setGeminiKeyState(key);
      save({ geminiKey: key });
    },
    [save]
  );

  const resetKeys = useCallback(() => {
    setOpenrouterKeyState("");
    setGeminiKeyState("");
    AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ openrouterKey: "", geminiKey: "" })
    ).catch(() => {});
  }, []);

  const getEffectiveOpenrouterKey = useCallback(
    () => openrouterKey.trim() || CONFIG.OPENROUTER_API_KEY,
    [openrouterKey]
  );

  const getEffectiveGeminiKey = useCallback(
    () => geminiKey.trim() || CONFIG.GEMINI_API_KEY,
    [geminiKey]
  );

  if (!loaded) return null;

  return (
    <SettingsContext.Provider
      value={{
        openrouterKey,
        geminiKey,
        setOpenrouterKey,
        setGeminiKey,
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
