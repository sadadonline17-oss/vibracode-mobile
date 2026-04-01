import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useProviderStore, CustomProvider } from '../stores/providerStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

const PROVIDER_TYPES = [
  { id: 'openrouter', label: 'OpenRouter', defaultUrl: 'https://openrouter.ai/api/v1', needsKey: true },
  { id: 'ollama',     label: '🦙 Ollama',  defaultUrl: 'http://localhost:11434',        needsKey: false },
  { id: 'anthropic',  label: 'Anthropic',  defaultUrl: 'https://api.anthropic.com',    needsKey: true },
  { id: 'openai',     label: 'OpenAI',     defaultUrl: 'https://api.openai.com/v1',    needsKey: true },
  { id: 'custom',     label: '⚙️ Custom',   defaultUrl: '',                              needsKey: true },
];

export default function ProviderSettingsScreen() {
  const {
    providers, addProvider, removeProvider, setDefault,
    selectedId, selectedModel, setModel,
  } = useProviderStore();

  const [adding, setAdding]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({ name: '', type: 'ollama', baseUrl: 'http://localhost:11434', apiKey: '' });

  const testAndAdd = useCallback(async () => {
    if (!form.baseUrl.trim()) { Alert.alert('Error', 'Base URL is required'); return; }
    setLoading(true);
    try {
      let models: string[] = [];

      if (form.type === 'ollama') {
        const r = await fetch(`${BACKEND_URL}/api/providers`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ action: 'list_ollama', baseUrl: form.baseUrl }),
        });
        const d = await r.json() as { models?: string[] };
        models = d.models ?? [];
      } else {
        try {
          const r = await fetch(`${form.baseUrl}/models`, {
            headers: form.apiKey ? { Authorization: `Bearer ${form.apiKey}` } : {},
            signal:  AbortSignal.timeout(5000),
          });
          const d = await r.json() as { data?: Array<{ id: string }> };
          models = (d.data ?? []).map(m => m.id).slice(0, 50);
        } catch { models = []; }
      }

      const testR = await fetch(`${BACKEND_URL}/api/providers`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          action:  'test',
          baseUrl: form.baseUrl,
          type:    form.type,
          apiKey:  form.apiKey,
          model:   models[0],
        }),
      });
      const testD = await testR.json() as { ok: boolean };

      addProvider({
        name:       form.name || `${form.type} Provider`,
        type:       form.type as any,
        baseUrl:    form.baseUrl,
        apiKey:     form.apiKey || undefined,
        models:     models.length ? models : ['default'],
        isDefault:  false,
        testStatus: testD.ok ? 'ok' : 'error',
      });

      setAdding(false);
      setForm({ name: '', type: 'ollama', baseUrl: 'http://localhost:11434', apiKey: '' });
      Alert.alert(
        testD.ok ? '✅ Connected' : '⚠️ Added (connection failed)',
        testD.ok ? `Found ${models.length} models` : 'Check URL and API key'
      );
    } catch (err) {
      Alert.alert('Error', String(err));
    } finally {
      setLoading(false);
    }
  }, [form, addProvider]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0f0f0f' }}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        🔌 AI Providers
      </Text>

      {providers.map(p => (
        <ProviderCard
          key={p.id}
          provider={p}
          isSelected={p.id === selectedId}
          selectedModel={selectedModel}
          onSelect={() => setDefault(p.id)}
          onSelectModel={setModel}
          onDelete={p.id !== 'openrouter' ? () => removeProvider(p.id) : undefined}
        />
      ))}

      {!adding ? (
        <TouchableOpacity
          onPress={() => setAdding(true)}
          style={{
            borderWidth: 1, borderColor: '#333', borderRadius: 12,
            padding: 14, alignItems: 'center', marginTop: 8,
          }}
        >
          <Text style={{ color: '#888' }}>+ Add Provider</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ borderWidth: 1, borderColor: '#333', borderRadius: 12, padding: 16, marginTop: 8 }}>
          <Text style={{ color: '#fff', marginBottom: 12, fontWeight: '600' }}>New Provider</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {PROVIDER_TYPES.map(t => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setForm(f => ({ ...f, type: t.id, baseUrl: t.defaultUrl }))}
                style={{
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                  backgroundColor: form.type === t.id ? '#7c3aed' : '#1a1a1a',
                  borderWidth: 1, borderColor: form.type === t.id ? '#7c3aed' : '#333',
                }}
              >
                <Text style={{ color: form.type === t.id ? '#fff' : '#888', fontSize: 13 }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            placeholder="Provider Name"
            placeholderTextColor="#555"
            style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', marginBottom: 8 }}
            value={form.name}
            onChangeText={v => setForm(f => ({ ...f, name: v }))}
          />
          <TextInput
            placeholder="Base URL (e.g. http://localhost:11434)"
            placeholderTextColor="#555"
            style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', marginBottom: 8 }}
            value={form.baseUrl}
            onChangeText={v => setForm(f => ({ ...f, baseUrl: v }))}
            autoCapitalize="none"
            keyboardType="url"
          />
          {PROVIDER_TYPES.find(t => t.id === form.type)?.needsKey && (
            <TextInput
              placeholder="API Key (optional for Ollama)"
              placeholderTextColor="#555"
              style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', marginBottom: 12 }}
              value={form.apiKey}
              onChangeText={v => setForm(f => ({ ...f, apiKey: v }))}
              secureTextEntry
              autoCapitalize="none"
            />
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setAdding(false)}
              style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#1a1a1a', alignItems: 'center' }}
            >
              <Text style={{ color: '#888' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={testAndAdd}
              disabled={loading}
              style={{ flex: 2, padding: 12, borderRadius: 8, backgroundColor: '#7c3aed', alignItems: 'center' }}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ color: '#fff', fontWeight: '600' }}>Test & Add</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

interface ProviderCardProps {
  provider:      CustomProvider;
  isSelected:    boolean;
  selectedModel: string;
  onSelect:      () => void;
  onSelectModel: (m: string) => void;
  onDelete?:     () => void;
}

function ProviderCard({ provider, isSelected, selectedModel, onSelect, onSelectModel, onDelete }: ProviderCardProps) {
  const statusColor = { ok: '#22c55e', error: '#ef4444', untested: '#888' }[provider.testStatus];
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={{
        borderWidth: 1, borderColor: isSelected ? '#7c3aed' : '#222',
        borderRadius: 12, padding: 14, marginBottom: 8,
        backgroundColor: isSelected ? '#1a0d2e' : '#111',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor }} />
          <Text style={{ color: '#fff', fontWeight: '600' }}>{provider.name}</Text>
          <Text style={{ color: '#555', fontSize: 11 }}>{provider.type}</Text>
        </View>
        {onDelete && (
          <TouchableOpacity onPress={onDelete}>
            <Text style={{ color: '#ef4444', fontSize: 18 }}>×</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={{ color: '#444', fontSize: 11, marginTop: 4 }}>{provider.baseUrl}</Text>
      {isSelected && provider.models.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {provider.models.slice(0, 20).map((m: string) => (
            <TouchableOpacity
              key={m}
              onPress={() => onSelectModel(m)}
              style={{
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginRight: 6,
                backgroundColor: selectedModel === m ? '#7c3aed' : '#1a1a1a',
              }}
            >
              <Text style={{ color: selectedModel === m ? '#fff' : '#888', fontSize: 12 }}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </TouchableOpacity>
  );
}
