'use client';

import { useEffect, useRef, useState } from 'react';

function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  return '<p>' + html + '</p>';
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
      {msg.fromSuggestion && !isUser && (
        <div className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 mb-1 flex items-center gap-1">
          <span>↑</span>
          <span>From: {msg.fromSuggestion}</span>
        </div>
      )}
      <div
        className={`text-sm leading-relaxed rounded-2xl px-4 py-2.5 max-w-[90%]
          ${isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-[#111318] border border-white/7 text-gray-200 rounded-bl-sm'
          }`}
        dangerouslySetInnerHTML={isUser
          ? undefined
          : { __html: renderMarkdown(msg.content) }
        }
      >
        {isUser ? msg.content : undefined}
      </div>
      <div className="font-mono text-xs text-gray-600 px-1">{msg.timestamp}</div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 bg-[#111318] border border-white/7 rounded-2xl rounded-bl-sm px-4 py-3 w-14">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function ChatPanel({ messages, isLoading, onSend }) {
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/7">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Chat
        </span>
        {isLoading && (
          <div className="ml-auto w-3 h-3 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-16">
            <span className="text-3xl opacity-40">💬</span>
            <p className="text-sm font-medium text-gray-400">Ask anything</p>
            <p className="text-xs text-gray-600 max-w-[180px]">
              Tap a suggestion or type a question about your meeting
            </p>
          </div>
        )}
        {messages.map(msg => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <TypingIndicator />
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-white/7">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Ask about your meeting… (Enter to send)"
          rows={1}
          className="flex-1 bg-[#1e2330] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl flex items-center justify-center text-white text-base transition-colors flex-shrink-0"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
