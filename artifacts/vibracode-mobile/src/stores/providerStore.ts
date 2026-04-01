import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CustomProvider {
  id:         string;
  name:       string;
  type:       'ollama' | 'openrouter' | 'anthropic' | 'openai' | 'custom';
  baseUrl:    string;
  apiKey?:    string;
  models:     string[];
  isDefault:  boolean;
  testStatus: 'untested' | 'ok' | 'error';
}

const DEFAULTS: CustomProvider[] = [
  {
    id:         'openrouter',
    name:       'OpenRouter',
    type:       'openrouter',
    baseUrl:    'https://openrouter.ai/api/v1',
    models:     [
      'openrouter/auto',
      'anthropic/claude-3-7-sonnet',
      'openai/gpt-4o',
      'meta-llama/llama-3.3-70b-instruct:free',
    ],
    isDefault:  true,
    testStatus: 'ok',
  },
  {
    id:         'ollama_local',
    name:       'Ollama (Local)',
    type:       'ollama',
    baseUrl:    'http://localhost:11434',
    models:     [],
    isDefault:  false,
    testStatus: 'untested',
  },
];

interface ProviderStore {
  providers:         CustomProvider[];
  selectedId:        string;
  selectedModel:     string;
  addProvider:       (p: Omit<CustomProvider, 'id'>) => void;
  removeProvider:    (id: string) => void;
  setDefault:        (id: string) => void;
  setModel:          (model: string) => void;
  updateModels:      (id: string, models: string[]) => void;
  updateStatus:      (id: string, status: 'ok' | 'error') => void;
  getActiveProvider: () => CustomProvider | undefined;
}

export const useProviderStore = create<ProviderStore>()(
  persist(
    (set, get) => ({
      providers:     DEFAULTS,
      selectedId:    'openrouter',
      selectedModel: 'openrouter/auto',

      addProvider: (p) =>
        set(s => ({ providers: [...s.providers, { ...p, id: Date.now().toString() }] })),

      removeProvider: (id) =>
        set(s => ({ providers: s.providers.filter(p => p.id !== id) })),

      setDefault: (id) => {
        set(s => ({
          selectedId:    id,
          selectedModel: s.providers.find(p => p.id === id)?.models[0] ?? '',
        }));
      },

      setModel: (model) => set({ selectedModel: model }),

      updateModels: (id, models) =>
        set(s => ({
          providers: s.providers.map(p => p.id === id ? { ...p, models } : p),
        })),

      updateStatus: (id, status) =>
        set(s => ({
          providers: s.providers.map(p => p.id === id ? { ...p, testStatus: status } : p),
        })),

      getActiveProvider: () => get().providers.find(p => p.id === get().selectedId),
    }),
    { name: 'vibcode_providers', storage: createJSONStorage(() => AsyncStorage) }
  )
);
