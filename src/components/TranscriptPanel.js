'use client';

import { useEffect, useRef } from 'react';

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const secs = s % 60;
  return `${m}:${secs.toString().padStart(2, '0')}`;
}

export default function TranscriptPanel({ isRecording, transcriptChunks, recordingTime, waveHeights, onStart, onStop }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptChunks]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Transcript</span>
        {isRecording && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-400/10 border border-red-400/20 rounded-full px-2 py-0.5">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            Live
          </div>
        )}
        {isRecording && (
          <span className="ml-auto font-mono text-sm text-gray-400">{formatTime(recordingTime)}</span>
        )}
      </div>

      {isRecording && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
          <div className="flex items-center gap-0.5 h-5">
            {waveHeights.map((h, i) => (
              <div key={i} className="w-0.5 bg-red-400 rounded-full opacity-70" style={{ height: h + 'px' }} />
            ))}
          </div>
          <span className="text-xs text-gray-600">Listening…</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {transcriptChunks.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-16">
            <span className="text-3xl opacity-40">🎙</span>
            <p className="text-sm font-medium text-gray-400">No transcript yet</p>
            <p className="text-xs text-gray-600 max-w-xs">Start recording to see live transcription</p>
          </div>
        )}
        {transcriptChunks.map((chunk) => (
          <div key={chunk.id} className="bg-[#111318] border border-white/10 rounded-xl px-4 py-3">
            <div className="font-mono text-xs text-gray-600 mb-1">{chunk.timestamp}</div>
            <div className="text-sm text-gray-300 leading-relaxed">{chunk.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-3 px-4 py-3 border-t border-white/10">
        <button
          onClick={isRecording ? onStop : onStart}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-base border-2 transition-all ${
            isRecording
              ? 'bg-red-400/10 border-red-400 text-red-400'
              : 'bg-[#1e2330] border-white/10 text-gray-400 hover:border-blue-500 hover:text-blue-400'
          }`}
        >
          {isRecording ? '■' : '🎙'}
        </button>
        <span className="text-xs text-gray-600">
          {isRecording ? 'Recording · click to stop' : 'Click mic to start'}
        </span>
      </div>
    </div>
  );
}