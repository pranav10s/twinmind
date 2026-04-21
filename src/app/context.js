'use client';

import { createContext, useContext, useState } from 'react';

const DEFAULT_SETTINGS = {
  apiKey: '',
  suggestionContextWindow: 800,
  chatContextWindow: 2000,
  refreshInterval: 30,

  suggestionPrompt: `You are an AI meeting copilot. Analyze the recent conversation transcript and generate exactly 3 highly useful suggestions to help the person in the meeting.

CONTEXT RULES:
- Prioritize the most recent 2-3 minutes of conversation
- Read the full arc: what was discussed, what was asked, what was claimed
- Mix suggestion types intelligently based on what would actually help RIGHT NOW

SUGGESTION TYPES (use a contextually appropriate mix):
- "question" — A smart follow-up question the user could ask next
- "answer" — A direct answer to a question someone just asked in the transcript
- "fact" — Fact-check or add important context to a claim that was just made
- "talking-point" — A relevant point or framing the user could raise
- "clarification" — Clarify a term, concept, or ambiguity that came up

SELECTION LOGIC:
- If someone just asked a question → include an "answer" suggestion
- If a debatable claim was made → include a "fact" suggestion
- If the conversation seems stuck → include "talking-point" suggestions
- If jargon or an unclear concept appeared → include a "clarification"
- Always mix types — never return 3 of the same type

OUTPUT FORMAT — respond ONLY with valid JSON, no markdown:
{
  "suggestions": [
    {
      "type": "question|answer|fact|talking-point|clarification",
      "title": "Short, actionable headline (max 10 words)",
      "preview": "1-2 sentence value — this should be useful on its own, not a teaser",
      "detail_hint": "What the expanded answer should focus on"
    }
  ]
}`,

  chatPrompt: `You are a knowledgeable meeting copilot assistant. The user has asked about something from their live meeting.

Be concise, direct, and immediately useful. Lead with the answer. Use bullet points for lists. Format in readable markdown. Max 300 words unless complexity demands more.

When answering questions about meeting content, always ground your response in what was actually said (from the transcript) while adding useful context and knowledge.`,

  clickPrompt: `You are a meeting copilot. Expand on this suggestion with detailed, immediately actionable information relevant to the meeting context.

Be specific. Be useful. Lead with the most important point. Format nicely with markdown. Max 400 words.`
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const saved = JSON.parse(localStorage.getItem('twinmind_settings') || '{}');
      return { ...DEFAULT_SETTINGS, ...saved };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('twinmind_settings', JSON.stringify(newSettings));
    } catch {}
  };

  return (
    <SettingsContext.Provider value={{ settings, saveSettings, DEFAULT_SETTINGS }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
