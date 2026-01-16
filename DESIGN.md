# design.md — AutoQuote AI (Parallel Repair-Shop Quote Agent)

## 0) TL;DR
AutoQuote AI is a consumer-facing agent that helps a user get repair quotes fast by:
1) taking a description + optional photo(s) of car damage,
2) researching nearby repair shops and collecting phone numbers,
3) placing **parallel outbound calls** (demo-safe: calls your own numbers), describing the issue via realistic voice,
4) capturing each shop’s spoken response (price estimate + timing),
5) summarizing everything into a clean report in the frontend.

**Tools to use**
- AWS Bedrock + Anthropic Claude (agentic orchestration + summarization)
- Yutori (web research / locate shops / gather phone numbers + structured signals)
- TinyFish (AgentQL-style structured extraction from web pages as fallback/augment)
- ElevenLabs (TTS voice used in calls)
- Twilio (outbound calling + speech capture via TwiML)
- Auth0 (frontend login)
- Freepik (generate demo images + enhance images before analysis)
- Retool (ops + analytics + workflow monitoring)
- AWS DynamoDB (session state + quotes + audit trail)

**Critical requirement**
- Everything must be configurable via `.env` so we can run in **DEMO_MODE** and call **only our own test numbers** (no real repair shops).

---

## 1) User Experience (End-to-End)

### 1.1 Primary user journey (happy path)
1) User logs in (Auth0).
2) User enters:
   - location (city/ZIP or “use my location”)
   - car make/model/year (optional)
   - “what happened” description (required)
   - photo(s) of damage (optional)
3) Agent:
   - (optional) enhances photo(s) for clarity using Freepik (upscale/relight)
   - interprets description + images into a standardized “damage summary”
4) Agent uses Yutori to research and return the **closest 5 repair shops** with:
   - name, address, phone number, rating (optional), distance
5) Agent places **parallel calls** (Twilio) to those numbers (demo-safe override).
6) Each call plays an ElevenLabs-generated voice message describing the problem and asking 3 structured questions:
   - rough price range
   - earliest appointment / turnaround time
   - what info they need next (VIN/photos/in-person estimate)
7) Twilio speech recognition captures the shop’s spoken answer.
8) Claude summarizes each response and generates a final comparison report:
   - best price / fastest turnaround / “seems most professional”
   - caveats + confidence score + suggested follow-up questions
9) Frontend shows the report + “Call transcript summaries” + a “Call log”.

### 1.2 Demo mode user journey
Same UI, but calls are routed to:
- your teammate phones (humans), OR
- a “mock shop responder” (optional), OR
- a Twilio test flow (optional)

No real repair shops are contacted.

---

## 2) Architecture Overview

### 2.1 Components
**A) Frontend (Retool App or Web App)**
- Auth0 login
- “New Quote Session” form
- session status + progress
- results report view

**B) Orchestrator API (our backend; Claude-in-the-loop)**
- owns session state
- coordinates: image processing → research → calling → summarization → report
- exposes stable REST endpoints for the frontend

**C) Research Service**
- Yutori Research tasks for “closest 5 repair shops” + phone numbers
- TinyFish/AgentQL extraction fallback when a page needs structured parsing

**D) Voice + Call Service**
- ElevenLabs: generate TTS audio prompt
- Twilio: place calls, play audio, gather speech, send webhook callbacks

**E) Storage**
- DynamoDB for sessions, shops, call attempts, captured speech results, final report
- (optional) S3 for audio files (if hosting ElevenLabs audio for Twilio to fetch)

**F) Observability + Ops**
- Retool dashboard: sessions list, call outcomes, timings, errors, cost counters

### 2.2 High-level data flow
Frontend → Orchestrator API
- create session
- upload images / description
- start workflow

Orchestrator API → (Freepik + Claude)
- clean/interpret info

Orchestrator API → Yutori (+ TinyFish)
- find 5 nearest shops + phone numbers

Orchestrator API → ElevenLabs
- generate audio “shop pitch” prompt

Orchestrator API → Twilio
- place parallel calls
- Twilio fetches TwiML from our API
- Twilio plays audio + gathers speech
- Twilio posts webhook results back to our API

Orchestrator API → Claude
- summarize each shop response + produce report

Orchestrator API → Frontend
- status + final report

---

## 3) Tool Usage Mapping (Why each sponsor/tool is used)

### Auth0 (Frontend login)
- Protects the consumer UI and prevents random people from triggering calls.

### AWS Bedrock + Claude (via Bedrock)
- Core “agentic brain”: converts messy user input → structured intent, call script, and final report.
- Summarizes each shop response and produces a ranked comparison.

### Freepik
- Generate demo “broken car” images (for hack demo if user doesn’t have real photo).
- Enhance user-provided photos (upscale/relight) before Claude analysis to improve clarity.

### Yutori
- Performs web research to find nearby repair shops and phone numbers reliably.

### TinyFish
- Structured extraction from web pages (e.g., parse phone number/address reliably from a shop directory page) as a fallback/augment to Yutori.

### ElevenLabs
- Produces a realistic, clear voice prompt that describes the problem and asks for quotes.

### Twilio
- Places outbound calls, plays the audio prompt, gathers spoken responses via speech recognition, and triggers callbacks to our API.

### Retool
- Frontend (fast build) OR ops analytics console:
  - session list, call success rates, time to quote, error breakdown

### AWS DynamoDB
- Session persistence: shops list, call attempts, results, final report.

---

## 4) Detailed Workflow

### 4.1 Session creation
Frontend calls:
- POST `/api/v1/sessions`
Body:
- location (city/ZIP/latlng)
- user inputs (car info optional, description required)
- mode flags (demo)

Backend:
- creates `session_id`
- initializes state = `CREATED`

### 4.2 Intake normalization (Claude)
Backend sends Claude:
- user description
- car info
- (optional) photo URLs (after optional Freepik enhance)

Claude returns:
- structured “damage_summary” JSON-like object:
  - suspected issue category (e.g., “bumper damage”, “headlight”, “paint scratch”, “unknown”)
  - severity guess
  - key questions to ask shop (max 3)
  - a short call script paragraph (plain English)

### 4.3 Image processing (Freepik + Claude)
If user uploaded images:
1) optionally run Freepik image enhancement (upscale/relight) to improve readability
2) send enhanced image(s) to Claude vision for:
   - visible damage description
   - parts likely affected
   - “uncertainty” notes (“hard to tell from angle”)

If user has no images:
- generate 1–2 demo images via Freepik (“a scratched bumper”, “broken headlight”) and label them as “demo images”.

### 4.4 Shop discovery (Yutori + TinyFish)
Backend creates a Yutori research task:
Prompt includes:
- “Find 5 closest auto repair/body shops near <location>”
- “Return: name, address, phone number, website, distance, rating if available”
- Output format: structured list

If Yutori returns partial info:
- use TinyFish (AgentQL) to open a candidate page and extract missing phone/address.

Result stored as `shops[]` in session.

### 4.5 Call script generation (Claude → ElevenLabs)
Claude creates:
- “shop_pitch_text” (20–35 seconds max), e.g.:
  - “Hi, I’m calling for a quick estimate…”
  - describes issue
  - asks 3 structured questions
  - asks them to speak answers clearly and slowly

Backend calls ElevenLabs TTS and gets audio bytes (mp3).
Backend hosts this mp3 at a public URL Twilio can fetch (S3 pre-signed URL or our `/media/{id}.mp3` endpoint).

### 4.6 Parallel outbound calls (Twilio)
For each shop (up to 5), in parallel:
- Create Twilio outbound call:
  - `to`: shop.phone (or overridden demo number)
  - `from`: Twilio number
  - `url`: our TwiML webhook endpoint `/twilio/twiml?session_id=...&shop_id=...&audio_url=...`

Our TwiML response (conceptually):
- `<Play>` the ElevenLabs mp3 URL
- `<Gather input="speech" ...>` to capture their spoken response
- On gather completion, Twilio hits our `/twilio/gather_callback` with SpeechResult + confidence
- If no speech captured, retry once or mark as “No response”.

### 4.7 Summarize shop responses (Claude)
For each completed call:
- Claude summarizes into:
  - price range
  - timeline
  - conditions (“needs in-person inspection”)
  - confidence score
  - “follow-up question”

Final report:
- ranked list
- best pick by price/time
- disclaimers (“quotes are rough”, “verify with shop”)

---

## 5) Backend API (Stable Contract)

### 5.1 Frontend-facing endpoints
- POST `/api/v1/sessions`
- GET `/api/v1/sessions/{session_id}`
- POST `/api/v1/sessions/{session_id}/upload` (optional: presigned upload)
- POST `/api/v1/sessions/{session_id}/start` (kicks off: research + calls)
- GET `/api/v1/sessions/{session_id}/report`

### 5.2 Twilio webhook endpoints
- GET/POST `/twilio/twiml` (returns TwiML XML)
- POST `/twilio/gather_callback`
- POST `/twilio/status_callback` (optional call lifecycle updates)

### 5.3 Data model (DynamoDB recommended)
**Table: Sessions**
- pk: `session_id`
- attributes:
  - `user_id`
  - `location`
  - `description`
  - `images[]`
  - `damage_summary`
  - `shops[]` (or separate table)
  - `call_jobs[]` (or separate table)
  - `status` (CREATED → RESEARCHING → CALLING → SUMMARIZING → DONE/FAILED)
  - `report`

**Table: Calls (optional)**
- pk: `session_id`
- sk: `shop_id`
- attributes:
  - `twilio_call_sid`
  - `to_number`
  - `status`
  - `speech_result`
  - `confidence`
  - `summary`

---

## 6) DEMO_MODE + .env Configuration (must-have)

### 6.1 Key environment variables
Auth / UI
- `AUTH0_DOMAIN=...`
- `AUTH0_CLIENT_ID=...`
- `AUTH0_AUDIENCE=...` (if protecting backend APIs)
- `AUTH0_CALLBACK_URL=...`

AWS / Bedrock
- `AWS_REGION=...`
- `BEDROCK_MODEL_ID=...` (Claude via Bedrock)
- `DYNAMODB_TABLE_SESSIONS=...`
- `S3_BUCKET_MEDIA=...` (optional)

Yutori / TinyFish
- `YUTORI_API_KEY=...`
- `TINYFISH_API_KEY=...` (or AgentQL key)

Freepik
- `FREEPIK_API_KEY=...`

ElevenLabs
- `ELEVENLABS_API_KEY=...`
- `ELEVENLABS_VOICE_ID=...`

Twilio
- `TWILIO_ACCOUNT_SID=...`
- `TWILIO_AUTH_TOKEN=...`
- `TWILIO_FROM_NUMBER=...`
- `TWILIO_WEBHOOK_BASE_URL=...` (public URL for Twilio to reach your server)

### 6.2 Demo safety switches (mandatory)
- `DEMO_MODE=true|false`
- `DEMO_TO_NUMBERS=+14155550111,+14155550112,...` (comma-separated)
- `DEMO_NUMBER_STRATEGY=round_robin|single_override`
- `SCOPE_CALLS_TO_DEMO_LIST=true` (hard block: if `to` not in demo list, refuse)

Behavior:
- If `DEMO_MODE=true`, backend must override every shop phone number with demo numbers.
- If a real phone number slips through, backend must reject call creation with a loud error.

Optional extra safety:
- `ALLOW_OUTBOUND_CALLS=false` (when false, simulate call responses with canned text)

---

## 7) MVP Plan (Buildable Fast, Still Impressive)

### MVP (demo-ready)
- Retool UI (login can be mocked if needed)
- User enters description + ZIP
- Yutori returns 5 “shops” (can be mocked if needed)
- Parallel Twilio calls to DEMO numbers
- Twilio plays ElevenLabs audio and gathers speech
- Claude summarizes and returns report

### Nice-to-have (if time)
- Freepik-generated demo images + enhancement
- TinyFish extraction fallback
- Retool analytics dashboard (call outcomes, duration, cost)

---

## 8) Risk, Compliance, and Safety Notes
- Calls must go only to **explicit demo numbers** (team-owned).
- Display an in-app banner: “DEMO MODE — no real businesses are called.”
- If recording is enabled, inform participants (“this call may be recorded for demo analysis”).
- Store minimal data; avoid collecting personal data beyond what’s needed for the demo session.

---

## 9) Retool Usage (Recommended)
Two Retool apps:
1) **User App**: start session, view report
2) **Ops App**: session list + call outcomes + retries + error logs

Optionally, Retool Workflows:
- webhook-triggered workflow to log Twilio callbacks and update dashboards.

END.

