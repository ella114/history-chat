# History Persona Chat

An AI web app for role-faithful conversations with historical figures. The project focuses on making persona-based dialogue feel distinct, bounded, and product-ready rather than turning every answer into generic chatbot copy.

[Live Demo](https://historypersona.cn) · [Production Deployment](https://history-chat-7knqf8kt4-ellas-projects-9863373f.vercel.app)

## Overview

History Persona Chat is a production-deployed MVP built around one core question: how do you make historical-character dialogue feel more authentic than a thin prompt wrapped around a generic LLM?

Instead of treating the model as a universal answer engine, this project defines each persona with structured role data, worldview, speaking style, safety boundaries, and behavioral constraints. The runtime then combines those persona configs with recent conversation context, streaming generation, moderation, and persistent chat history.

Current scope:

- 7 role-based entry categories
- 25 active historical personas
- Persona detail pages, streaming chat, and conversation history
- Auto-generated conversation titles and summaries
- Input moderation and explicit non-impersonation boundaries
- Supabase-backed persistence with local fallback for unauthenticated usage
- Production deployment on Vercel with a custom domain

## Why This Project Matters

Most AI roleplay demos fail in three places:

- outputs quickly collapse into one model voice
- persona consistency degrades over multi-turn dialogue
- there is no real product layer around storage, safety, and retrieval

This project addresses those gaps by combining persona modeling, lightweight context management, AI provider abstraction, and a deployable full-stack application.

## AI Design

### 1. Structured Persona Modeling

Each historical figure is defined with typed metadata and generation controls, including:

- era and historical positioning
- role category and domain
- short and long bio
- voice and worldview
- response style guidance
- do / do-not rules
- safety boundaries

This keeps personas extensible: adding a new figure is mostly a configuration and content task rather than a rewrite of the dialogue engine.

### 2. Prompt Strategy for Role Fidelity

The reply prompt is designed to keep the assistant inside the character voice:

- first-person answers only
- no out-of-role explanation or meta commentary
- no generic listicle or encyclopedia responses
- bounded response length and tone
- explicit handling for historical uncertainty

The result is not "pretend historian mode" but closer to a controlled historical dialogue simulation.

### 3. Context Compression

To keep multi-turn chat coherent without uncontrolled prompt growth, the system currently carries:

- the latest 8 messages
- the current conversation title
- the current conversation summary

This creates a simple but practical base for later upgrades such as long-term summaries plus recent-turn stitching.

### 4. Safety and Reliability

The app uses both rule-based risk checks and model moderation:

- OpenAI Moderation API for uncertain inputs
- safe fallback replies for disallowed content
- explicit disclaimer that this is an interpretive dialogue product, not literal historical resurrection
- reply constraints that prevent the persona from acting like a real present-day human

### 5. Provider Abstraction

The AI layer is not hardcoded to one backend. The provider interface supports:

- input moderation
- reply generation
- streaming output
- title and summary generation

This makes it straightforward to swap in another model provider while keeping the frontend and data layer stable.

## Product Features

- Home page with role-based discovery
- Persona profile pages
- Streaming chat UI
- Conversation history page
- Automatic conversation naming and summarization
- Per-message feedback capture
- Authentication-aware persistence
- Browser local storage fallback

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- OpenAI Responses API
- OpenAI Moderation API
- Supabase Auth + Postgres
- Vercel

## Repository Structure

```text
app/
  api/chat/route.ts         # chat API with moderation + streaming response
  api/chat/title/route.ts   # title / summary generation
  chat/[slug]/page.tsx      # persona chat page
  history/page.tsx          # conversation history
  personas/[slug]/page.tsx  # persona profile page
components/
  chat/                     # chat UI and message rendering
  history/                  # history list and actions
  home/                     # category and persona cards
lib/
  ai/                       # provider abstraction and implementations
  context.ts                # conversation context strategy
  data/personas.ts          # structured persona dataset
  storage/                  # Supabase + local fallback repositories
  supabase/                 # auth and client setup
```

## Local Development

1. Install dependencies

```bash
npm install
```

2. Copy environment variables

```bash
cp .env.example .env.local
```

3. Start the development server

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Environment

Core variables:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=your_server_side_key
OPENAI_CHAT_MODEL=gpt-5-mini
OPENAI_TITLE_MODEL=gpt-5-mini
OPENAI_MODERATION_MODEL=omni-moderation-latest
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=https://historypersona.cn
```

## Status

This repository already includes:

- a deployable MVP
- production deployment
- typed persona system
- streaming model responses
- moderation + fallback logic
- persistence and auth integration

Planned next steps:

- anonymous identity migration
- stronger long-context summarization
- analytics and feedback aggregation
- richer evaluation of persona consistency

## Notes

- All OpenAI calls run server-side; keys are not exposed to the browser.
- If OpenAI fails due to key, network, or quota issues, the app can fall back to a mock provider to avoid full chat failure.
- The product is intentionally framed as interpretive dialogue, not as literal reproduction of historical figures.
