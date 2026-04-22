'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from '@/app/context';
import TranscriptPanel from '@/components/TranscriptPanel';
import SuggestionsPanel from '@/components/SuggestionsPanel';
import ChatPanel from '@/components/ChatPanel';
import SettingsModal from '@/components/SettingsModal';

function nowStr() {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function Home() {
  const { settings } = useSettings();

  const [isRecording, setIsRecording] = useState(false);
  const [transcriptChunks, setTranscriptChunks] = useState([]);
  const [suggestionBatches, setSuggestionBatches] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sugStatus, setSugStatus] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveHeights, setWaveHeights] = useState(Array(12).fill(4));
  const [toast, setToast] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const chunkTimerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const waveIntervalRef = useRef(null);
  const recordingStartRef = useRef(null);
  const sessionStartRef = useRef(new Date());

  const settingsRef = useRef(settings);
  const transcriptChunksRef = useRef(transcriptChunks);
  const isLoadingSuggestionsRef = useRef(isLoadingSuggestions);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { transcriptChunksRef.current = transcriptChunks; }, [transcriptChunks]);
  useEffect(() => { isLoadingSuggestionsRef.current = isLoadingSuggestions; }, [isLoadingSuggestions]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Transcription ──────────────────────────────────────────────────────────

  const processAudioChunk = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return transcriptChunksRef.current;
    const apiKey = settingsRef.current.apiKey;
    if (!apiKey) return transcriptChunksRef.current;

    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    audioChunksRef.current = [];

    try {
      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');
      formData.append('apiKey', apiKey);

      const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.text && data.text.trim().length > 3) {
        const newChunk = {
          text: data.text.trim(),
          timestamp: nowStr(),
          id: Date.now(),
        };
        const updated = [...transcriptChunksRef.current, newChunk];
        transcriptChunksRef.current = updated;
        setTranscriptChunks(updated);
        return updated;
      }
    } catch (err) {
      console.error('Transcription error:', err);
    }

    return transcriptChunksRef.current;
  }, []);

  // ── Suggestions ────────────────────────────────────────────────────────────

  const doRefreshSuggestions = useCallback(async (chunksOverride = null) => {
    if (!chunksOverride && isLoadingSuggestionsRef.current) return;

    const apiKey = settingsRef.current.apiKey;
    if (!apiKey) return;

    setIsLoadingSuggestions(true);
    isLoadingSuggestionsRef.current = true;
    setSugStatus('Analyzing conversation…');

    try {
      const chunks = chunksOverride || transcriptChunksRef.current;
      const transcript = chunks.map(c => c.text).join('\n\n');
      if (!transcript.trim()) {
        setSugStatus('No transcript yet');
        return;
      }

      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          apiKey,
          prompt: settingsRef.current.suggestionPrompt,
          contextWindow: settingsRef.current.suggestionContextWindow,
        }),
      });

      const data = await res.json();
      if (data.suggestions) {
        setSuggestionBatches(prev => [{
          suggestions: data.suggestions,
          timestamp: nowStr(),
          id: Date.now(),
        }, ...prev]);
        setSugStatus('Updated ' + nowStr());
      }
    } catch (err) {
      setSugStatus('⚠ ' + err.message);
    } finally {
      setIsLoadingSuggestions(false);
      isLoadingSuggestionsRef.current = false;
    }
  }, []);

  // ── Recording ──────────────────────────────────────────────────────────────

  const startNewRecorder = useCallback((stream) => {
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    mediaRecorderRef.current = mr;
    audioChunksRef.current = [];

    mr.ondataavailable = e => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mr.onstop = async () => {
      await processAudioChunk();
    };

    mr.start();
    return mr;
  }, [processAudioChunk]);

  const startRecording = useCallback(async () => {
    if (!settingsRef.current.apiKey) {
      setShowSettings(true);
      showToast('Please add your Groq API key first');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      startNewRecorder(stream);
      setIsRecording(true);
      recordingStartRef.current = Date.now();

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(Date.now() - recordingStartRef.current);
      }, 1000);

      waveIntervalRef.current = setInterval(() => {
        setWaveHeights(Array(12).fill(0).map(() => 4 + Math.random() * 14));
      }, 100);

      chunkTimerRef.current = setInterval(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === 'recording' &&
          streamRef.current &&
          streamRef.current.active
        ) {
          mediaRecorderRef.current.stop();
          setTimeout(() => {
            if (streamRef.current && streamRef.current.active) {
              startNewRecorder(streamRef.current);
            }
          }, 300);
        }
      }, 30000);

      refreshTimerRef.current = setInterval(() => {
        doRefreshSuggestions();
      }, settingsRef.current.refreshInterval * 1000);

    } catch (err) {
      showToast('Mic access denied: ' + err.message);
    }
  }, [startNewRecorder, doRefreshSuggestions]);

  const stopRecording = useCallback(() => {
    clearInterval(chunkTimerRef.current);
    clearInterval(refreshTimerRef.current);
    clearInterval(timerIntervalRef.current);
    clearInterval(waveIntervalRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.onstop = async () => {
        const updatedChunks = await processAudioChunk();
        // Wait for any ongoing suggestion refresh to finish
        const waitForIdle = () => new Promise(resolve => {
          const check = setInterval(() => {
            if (!isLoadingSuggestionsRef.current) {
              clearInterval(check);
              resolve();
            }
          }, 200);
        });
        await waitForIdle();
        await doRefreshSuggestions(updatedChunks);
      };
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    mediaRecorderRef.current = null;
    setIsRecording(false);
    setWaveHeights(Array(12).fill(4));
  }, [processAudioChunk, doRefreshSuggestions]);

  // ── Manual Refresh ─────────────────────────────────────────────────────────

  const handleManualRefresh = useCallback(async () => {
    await processAudioChunk();
    await doRefreshSuggestions();
  }, [processAudioChunk, doRefreshSuggestions]);

  // ── Chat ───────────────────────────────────────────────────────────────────

  const sendChatMessage = useCallback(async (text, fromSuggestion = null, useClickPrompt = false) => {
    if (!text.trim() || isLoadingChat || !settingsRef.current.apiKey) return;

    const userMsg = { role: 'user', content: text, timestamp: nowStr(), id: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setIsLoadingChat(true);

    const transcript = transcriptChunksRef.current
      .map(c => c.text)
      .join('\n\n')
      .slice(-settingsRef.current.chatContextWindow);

    const streamId = Date.now() + 1;
    const assistantMsg = {
      role: 'assistant',
      content: '',
      timestamp: nowStr(),
      id: streamId,
      fromSuggestion,
    };
    setChatMessages(prev => [...prev, assistantMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          apiKey: settingsRef.current.apiKey,
          prompt: useClickPrompt
            ? settingsRef.current.clickPrompt
            : settingsRef.current.chatPrompt,
          transcript,
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value);
        setChatMessages(prev =>
          prev.map(m => m.id === streamId ? { ...m, content: full } : m)
        );
      }
    } catch (err) {
      setChatMessages(prev =>
        prev.map(m => m.id === streamId
          ? { ...m, content: '⚠ Error: ' + err.message }
          : m
        )
      );
    } finally {
      setIsLoadingChat(false);
    }
  }, [isLoadingChat]);

  const handleSuggestionTap = useCallback((suggestion) => {
    const text = `${suggestion.title}\n\n${suggestion.preview}`;
    sendChatMessage(text, suggestion.title, true);
  }, [sendChatMessage]);

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExport = () => {
    const data = {
      session_start: sessionStartRef.current.toISOString(),
      exported_at: new Date().toISOString(),
      transcript: transcriptChunks.map(c => ({ timestamp: c.timestamp, text: c.text })),
      suggestion_batches: suggestionBatches.map(b => ({
        timestamp: b.timestamp,
        suggestions: b.suggestions,
      })),
      chat_history: chatMessages.map(m => ({
        role: m.role,
        timestamp: m.timestamp,
        content: m.content,
        from_suggestion: m.fromSuggestion || undefined,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twinmind-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Session exported!');
  };

  useEffect(() => {
    if (!settings.apiKey) setShowSettings(true);
  }, []);

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen bg-[#0a0b0e] text-white flex flex-col overflow-hidden">

      {/* Topbar */}
      <div className="flex items-center gap-4 px-5 h-12 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 font-semibold text-[15px]">
          <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]" />
          TwinMind
        </div>
        <div className="font-mono text-xs text-gray-600 bg-[#1e2330] border border-white/10 rounded-full px-3 py-0.5">
          {transcriptChunks.length} chunks · {suggestionBatches.length} refreshes · {chatMessages.filter(m => m.role === 'user').length} messages
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs text-gray-400 border border-white/10 bg-[#1e2330] hover:bg-white/5 rounded-lg px-3 py-1.5 transition-colors"
          >
            ↓ Export
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 border border-white/10 bg-[#1e2330] hover:bg-white/5 rounded-lg px-3 py-1.5 transition-colors"
          >
            ⚙ Settings
          </button>
        </div>
      </div>

      {/* 3 columns */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 border-r border-white/10 overflow-hidden">
          <TranscriptPanel
            isRecording={isRecording}
            transcriptChunks={transcriptChunks}
            recordingTime={recordingTime}
            waveHeights={waveHeights}
            onStart={startRecording}
            onStop={stopRecording}
          />
        </div>
        <div className="w-1/3 border-r border-white/10 overflow-hidden">
          <SuggestionsPanel
            suggestionBatches={suggestionBatches}
            isLoading={isLoadingSuggestions}
            status={sugStatus}
            onRefresh={handleManualRefresh}
            onTap={handleSuggestionTap}
          />
        </div>
        <div className="w-1/3 overflow-hidden">
          <ChatPanel
            messages={chatMessages}
            isLoading={isLoadingChat}
            onSend={sendChatMessage}
          />
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {toast && (
        <div className="fixed bottom-5 right-5 bg-[#1e2330] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
