# TwinMind — Live Meeting Copilot

A real-time AI assistant that listens to any live conversation, transcribes speech, and surfaces 3 contextual suggestions every 30 seconds to help the participant respond better, fact-check claims, and ask smarter questions.

## Live Demo
https://twinmind-pi.vercel.app

## GitHub
https://github.com/pranav10s/twinmind

## Setup

```bash
git clone https://github.com/pranav10s/twinmind.git
cd twinmind
npm install
npm run dev
```

Open http://localhost:3000, click Settings, paste your Groq API key from console.groq.com, and click the mic.

## Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 16 | API routes keep the Groq key server-side |
| Transcription | Groq Whisper Large V3 | Fast, accurate, required by spec |
| Suggestions & Chat | Groq GPT-OSS 120B | Required by spec |
| Styling | Tailwind CSS | Fast iteration |
| Deployment | Vercel | Zero-config Next.js deploys |

## How It Works

1. Browser captures mic audio via MediaRecorder
2. Every 30s the recorder stops, audio blob is sent to `/api/transcribe` → Whisper Large V3
3. Transcript chunk is appended to the left column
4. Every 30s a separate timer sends the recent transcript to `/api/suggestions` → GPT-OSS 120B
5. 3 suggestion cards appear at the top of the middle column
6. Clicking a card sends it to `/api/chat` with the full transcript and a separate longer-form prompt
7. Chat streams token by token back to the right column

## Prompt Strategy

### The core judgment problem
The assignment is not about formatting 3 suggestions — it is about knowing what type of suggestion to surface at what moment. A generic "follow-up question" is not useful. A direct answer to a question just asked is.

### Suggestion decision tree
The prompt gives the model explicit rules:
- Question just asked → always include an **answer**
- Debatable claim made → always include a **fact check**
- Jargon or acronym appeared → include a **clarification**
- Conversation stalling → include **talking points**
- Natural next step → include a **question to ask**
- Never return 3 of the same type

### Preview quality
The prompt explicitly says previews must deliver standalone value — not teasers. A preview like "This could be useful" is worthless. A preview like "Redis Cluster with consistent hashing handles ~1M ops/sec/node" is useful on its own.

### Click vs chat prompts
Clicking a suggestion uses a separate `clickPrompt` that asks for detailed expansion with concrete action items, data, and frameworks. Regular chat uses a conversational prompt. Both receive the full transcript as context.

### Context windows
- **Suggestions**: 800 chars — recent context matters more than full history
- **Chat**: 2000 chars — needs more context for accurate grounded answers

## Tradeoffs

| Decision | Reason |
|----------|--------|
| 30s refresh interval | Matches natural conversation pace — faster creates noise |
| Refs for interval state | React state is stale inside setInterval — refs stay fresh |
| Stop/restart recorder every 30s | Produces clean complete webm files Whisper can process |
| JSON-only suggestion output | Prevents model preamble that breaks JSON.parse |
| Next.js API routes | API key never exposed to browser |
| No persistence | Matches spec — keeps code simple and clean |

## Project Structure

```
src/
  app/
    page.js              # Main layout and all state logic
    context.js           # Settings context with default prompts
    globals.css          # Minimal global styles
    api/
      transcribe/route.js  # Whisper transcription endpoint
      suggestions/route.js # GPT-OSS 120B suggestions endpoint
      chat/route.js        # GPT-OSS 120B streaming chat endpoint
  components/
    TranscriptPanel.js   # Left column — mic + transcript
    SuggestionsPanel.js  # Middle column — suggestion batches + countdown
    ChatPanel.js         # Right column — streaming chat
    SettingsModal.js     # API key + editable prompts + context windows
```