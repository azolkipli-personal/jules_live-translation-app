# Jules - Live Translation App

## Why

Sitting in a meeting conducted in a language you're still learning is exhausting. You catch fragments, miss nuance, and by the time you've mentally translated one sentence, the conversation has moved on. Real-time interpretation services exist, but they're expensive and overkill for internal team meetings where you just need a live transcript with rough translation to stay oriented. The gap: something that runs in a browser tab, streams audio, and gives you a running translation without requiring a human interpreter or a $500/month SaaS subscription.

## What

Jules is a lightweight web app that streams live audio from your browser to Google Cloud's Speech-to-Text and Translation APIs, displaying both the transcribed Japanese and the English translation in real time. It's designed for meetings — open it in a tab, start the stream, and you get a running feed of what's being said in both languages.

The impact: stay oriented in Japanese meetings without the cognitive overload of mentally translating everything yourself. It's not a replacement for learning the language — it's a bridge while you do.

## Features

- **Real-time speech-to-text** — Streams audio via WebSocket, transcribes with Google Cloud Speech
- **Live translation** — Japanese → English via Google Cloud Translation API
- **Interim results** — See partial transcriptions as the speaker talks
- **Browser-based** — No app install, works from any modern browser
- **Socket.io streaming** — Low-latency bidirectional audio pipeline
- **Minimal UI** — Clean two-panel layout: transcription on top, translation below

## Quick Start

```bash
git clone https://github.com/azolkipli-personal/jules_live-translation-app
cd jules_live-translation-app

# Install dependencies
npm install

# Build frontend
npm run build

# Set up Google Cloud authentication
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"

# Start server
npm start
```

Open http://localhost:3000, click "Start Translating", and speak.

### Requirements
- Node.js 18+
- Google Cloud project with Speech-to-Text and Translation APIs enabled
- Service account with appropriate permissions

## Tech Stack

- **Server**: Node.js, Express, Socket.io
- **Speech**: Google Cloud Speech-to-Text (streaming)
- **Translation**: Google Cloud Translation API (v2)
- **Frontend**: Vanilla JS with esbuild bundling

## License

MIT
