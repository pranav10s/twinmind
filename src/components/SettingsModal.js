'use client';

import { useState } from 'react';
import { useSettings } from '@/app/context';

export default function SettingsModal({ onClose }) {
  const { settings, saveSettings, DEFAULT_SETTINGS } = useSettings();
  const [local, setLocal] = useState({ ...settings });

  const set = (key, value) => setLocal(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    saveSettings(local);
    onClose();
  };

  const handleReset = () => {
    setLocal({ ...DEFAULT_SETTINGS, apiKey: local.apiKey });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#111318] border border-white/10 rounded-2xl p-7 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        {/* API Key */}
        <div className="mb-5">
          <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">
            Groq API Key
          </label>
          <input
            type="password"
            value={local.apiKey}
            onChange={e => set('apiKey', e.target.value)}
            placeholder="gsk_..."
            className="w-full bg-[#1e2330] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-600 mt-1">Get your key at console.groq.com</p>
        </div>

        {/* Numbers */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">
              Suggestion Context
            </label>
            <input
              type="number"
              value={local.suggestionContextWindow}
              onChange={e => set('suggestionContextWindow', Number(e.target.value))}
              className="w-full bg-[#1e2330] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">
              Chat Context
            </label>
            <input
              type="number"
              value={local.chatContextWindow}
              onChange={e => set('chatContextWindow', Number(e.target.value))}
              className="w-full bg-[#1e2330] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">
              Auto-refresh (secs)
            </label>
            <input
              type="number"
              value={local.refreshInterval}
              onChange={e => set('refreshInterval', Number(e.target.value))}
              className="w-full bg-[#1e2330] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Suggestion Prompt */}
        <div className="mb-5">
          <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">
            Live Suggestion Prompt
          </label>
          <textarea
            rows={8}
            value={local.suggestionPrompt}
            onChange={e => set('suggestionPrompt', e.target.value)}
            className="w-full bg-[#1e2330] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 resize-none font-mono"
          />
        </div>

        {/* Chat Prompt */}
        <div className="mb-5">
          <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">
            Chat System Prompt
          </label>
          <textarea
            rows={5}
            value={local.chatPrompt}
            onChange={e => set('chatPrompt', e.target.value)}
            className="w-full bg-[#1e2330] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 resize-none font-mono"
          />
        </div>

        {/* Click Prompt */}
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">
            Suggestion Click Prompt
          </label>
          <textarea
            rows={5}
            value={local.clickPrompt}
            onChange={e => set('clickPrompt', e.target.value)}
            className="w-full bg-[#1e2330] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 resize-none font-mono"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-white border border-white/10 rounded-lg px-4 py-2 transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="text-sm text-gray-400 border border-white/10 rounded-lg px-4 py-2 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
