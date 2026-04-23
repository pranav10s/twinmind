'use client';

import { useEffect, useState } from 'react';

function typeLabel(type) {
  const map = {
    'question': 'Question to Ask',
    'answer': 'Answer',
    'fact': 'Fact Check',
    'talking-point': 'Talking Point',
    'clarification': 'Clarification',
  };
  return map[type] || type;
}

function typeIcon(type) {
  const map = {
    'question': '?',
    'answer': '✓',
    'fact': '◎',
    'talking-point': '◆',
    'clarification': 'i',
  };
  return map[type] || '·';
}

function typeBadgeClass(type) {
  const map = {
    'question': 'bg-blue-500/10 text-blue-400',
    'answer': 'bg-green-500/10 text-green-400',
    'fact': 'bg-amber-500/10 text-amber-400',
    'talking-point': 'bg-purple-500/10 text-purple-400',
    'clarification': 'bg-gray-500/10 text-gray-400',
  };
  return map[type] || 'bg-gray-500/10 text-gray-400';
}

function SuggestionCard({ suggestion, onTap }) {
  return (
    <div
      onClick={() => onTap(suggestion)}
      className="bg-[#111318] border border-white/7 rounded-xl px-4 py-3 cursor-pointer hover:border-blue-500/50 hover:bg-[#1e2330] transition-all group relative"
    >
      <div className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${typeBadgeClass(suggestion.type)}`}>
        <span>{typeIcon(suggestion.type)}</span>
        <span>{typeLabel(suggestion.type)}</span>
      </div>
      <div className="text-sm font-medium text-white leading-snug mb-1">
        {suggestion.title}
      </div>
      <div className="text-xs text-gray-400 leading-relaxed">
        {suggestion.preview}
      </div>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
        →
      </span>
    </div>
  );
}

export default function SuggestionsPanel({
  suggestionBatches,
  isLoading,
  status,
  onRefresh,
  onTap,
  refreshInterval,
  isRecording,
}) {
  const [countdown, setCountdown] = useState(refreshInterval || 30);

  useEffect(() => {
    if (!isRecording) {
      setCountdown(refreshInterval || 30);
      return;
    }

    setCountdown(refreshInterval || 30);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return refreshInterval || 30;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, refreshInterval, suggestionBatches]);

  const isRateLimit = status?.includes('429') || status?.includes('Rate limit') || status?.includes('rate limit');

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Live Suggestions
        </span>
        <div className="ml-auto flex items-center gap-3">
          {isRecording && !isLoading && (
            <span className="font-mono text-xs text-gray-600">
              auto-refresh in {countdown}s
            </span>
          )}
          {isLoading && (
            <div className="w-3 h-3 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all disabled:opacity-40"
            title="Refresh suggestions"
          >
            ↺
          </button>
        </div>
      </div>

      {/* Batches */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
        {suggestionBatches.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-16">
            <span className="text-3xl opacity-40">✦</span>
            <p className="text-sm font-medium text-gray-400">No suggestions yet</p>
            <p className="text-xs text-gray-600 max-w-[200px]">
              Suggestions appear automatically every {refreshInterval || 30}s, or tap ↺ to generate now
            </p>
          </div>
        )}
        {suggestionBatches.map((batch, i) => (
          <div key={batch.id} className="flex flex-col gap-2">
            <div className="font-mono text-xs text-gray-600">
              {batch.timestamp} · refresh #{suggestionBatches.length - i}
            </div>
            {batch.suggestions.map((s, j) => (
              <SuggestionCard key={j} suggestion={s} onTap={onTap} />
            ))}
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-white/10">
        <span className={`font-mono text-xs ${isRateLimit ? 'text-amber-400' : 'text-gray-600'}`}>
          {isRateLimit
            ? '⚠ Rate limit hit — please wait a few seconds'
            : status || 'Ready'}
        </span>
      </div>

    </div>
  );
}