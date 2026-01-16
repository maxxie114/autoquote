# AutoQuote AI — Next.js 16 + Mastra + Claude Opus 4.5 (Thinking) + Vapi Spec Sheet

**Version:** 2.0 (Vapi Integration)  
**Last Updated:** January 2026

This is an updated, build-ready specification that replaces Twilio with **Vapi** for voice AI outbound calling, with **ElevenLabs** as the TTS provider integrated through Vapi's voice platform. The core product remains: capture user damage context, place parallel outbound calls (demo-safe), transcribe, summarize, and produce a clean comparison report.

---

## 0) Change Log (Vapi Update vs Previous Spec)

### Removed

- **Twilio Programmable Voice** — fully replaced by Vapi
- **TwiML webhooks** — Vapi handles call flow internally via assistants
- **Manual ElevenLabs TTS generation** — Vapi integrates ElevenLabs natively
- **Separate speech recognition** — Vapi provides built-in transcription

### Replaced / Re-scoped

| Component | Previous | New |
|-----------|----------|-----|
| **Voice Calls** | Twilio Programmable Voice + TwiML | Vapi Outbound Calling API |
| **TTS** | ElevenLabs API (standalone) | ElevenLabs via Vapi voice config |
| **Speech Recognition** | Twilio `<Gather>` + speech | Vapi built-in transcription |
| **Call Transcripts** | Manual processing | Vapi `artifact.transcript` |
| **Structured Data Extraction** | Claude post-processing | Vapi `analysisPlan.structuredDataPlan` |

### Retained from Previous Spec

- **LLM provider**: Claude Opus 4.5 via OpenRouter with "Thinking" enabled
- **Agent orchestration**: Mastra (Node/TS orchestration)
- **Frontend**: Next.js 16 with shadcn/ui glass UI
- **Persistence**: DynamoDB for sessions/calls
- **Image-to-text**: Freepik Image-to-Prompt API
- **Auth**: Auth0
- **Analytics**: Retool (internal only)
- **DEMO_MODE safety switches**: Mandatory

---

## 1) TL;DR (Product Summary)

AutoQuote AI is a consumer-facing web app that helps a user get repair quotes fast by:

1. Taking a description + optional photo(s) of car damage
2. Generating a standardized "damage summary" (including a textual description of the uploaded car image)
3. Calling multiple shops in parallel via **Vapi voice agents** (in DEMO_MODE, calls are hard-blocked to your own test numbers)
4. Capturing speech responses via Vapi's built-in transcription
5. Summarizing and ranking the results into a clean, user-friendly report

---

## 2) Non-Negotiable Safety Requirements

These are mandatory and should be treated as "ship blockers".

### 2.1 DEMO_MODE Must Hard-Block Real Calls

- If `DEMO_MODE=true`, override **every** destination number with demo numbers **before** calling Vapi
- If a non-demo number slips through, refuse to create the call and surface a loud error
- Vapi's `customer.number` field must be validated against the allowlist

### 2.2 ElevenLabs is the ONLY Permitted Voice Provider

- Vapi assistant `voice.provider` **MUST** be `"11labs"`
- Any attempt to configure Azure, PlayHT, Deepgram TTS, or other providers is a spec violation
- Validation must reject assistant configs with non-ElevenLabs voice providers

### 2.3 Claude Opus 4.5 (Thinking) is the ONLY Permitted LLM

- Vapi assistant `model.provider` **MUST** be `"anthropic"`
- Vapi assistant `model.model` **MUST** be `"claude-opus-4-5-20251101"` (Claude Opus 4.5)
- Extended thinking **MUST** be enabled with `thinking.type: "enabled"`
- **NO OTHER CLAUDE MODELS ARE PERMITTED** — not Sonnet, not Haiku, not older Opus versions
- Any attempt to use GPT-4o, GPT-4o-mini, Gemini, Llama, Sonnet, Haiku, or any other model is a spec violation
- Validation must reject assistant configs with any model other than Claude Opus 4.5

### 2.4 Minimal Data Retention

- Store only what you need to generate the report and show the call log
- Avoid collecting sensitive personal data beyond the session inputs
- Vapi recordings can be disabled via `artifactPlan.recordingEnabled: false`

### 2.5 Recording Disclosure (If Enabled)

If you enable call recording via Vapi's `artifactPlan`, you must explicitly inform participants. Vapi supports `compliancePlan.recordingConsentPlan` for automated consent collection.

---

## 3) Tech Stack (Final)

### 3.1 User-Facing

| Component | Technology |
|-----------|------------|
| Web App | **Next.js 16** (App Router), deployed on Vercel |
| UI Components | **shadcn/ui** + Tailwind (glass UI system) |
| Authentication | **Auth0** |

### 3.2 Agent + Orchestration

| Component | Technology |
|-----------|------------|
| Orchestration | **Mastra** (Node/TS) |
| LLM Gateway | **OpenRouter** (OpenAI-compatible API) |
| Model | `anthropic/claude-opus-4.5` with extended thinking |

### 3.3 Voice Calls (Vapi)

| Component | Technology |
|-----------|------------|
| Voice Platform | **Vapi** Outbound Calling API |
| TTS Provider | **ElevenLabs ONLY** — No other voice provider permitted |
| Conversation LLM | **Claude Opus 4.5 (Thinking) ONLY** — No Sonnet, Haiku, GPT, or other models |
| Transcription | Vapi built-in (Deepgram/AssemblyAI) |
| Call Management | Vapi `/call` endpoint |

> **⚠️ HARD REQUIREMENTS:**
> - The Vapi assistant MUST use **ElevenLabs** for TTS — no other voice provider.
> - The Vapi assistant MUST use **Claude Opus 4.5** (`claude-opus-4-5-20251101`) with **Thinking enabled** — no other model.

**Vapi Documentation:**
- Outbound Calling: https://docs.vapi.ai/calls/outbound-calling
- Create Call API: https://docs.vapi.ai/api-reference/calls/create
- ElevenLabs Integration: https://docs.vapi.ai/customization/custom-voices/elevenlabs

### 3.4 Image-to-Text (Description Only)

| Component | Technology |
|-----------|------------|
| Image Analysis | **Freepik Image-to-Prompt API** |

### 3.5 Persistence + Analytics

| Component | Technology |
|-----------|------------|
| Database | **DynamoDB** (sessions + calls) |
| Analytics | **Retool** (internal developer dashboards) |

---

## 4) UX: Next.js 16 Glass UI (User-Facing)

### 4.1 Pages (App Router)

1. `/` — Landing + "Start New Quote"
2. `/session/new` — Form: location, car info, description, upload photo
3. `/session/[id]` — Status, progress timeline, call log, report
4. `/session/[id]/report` — Report-focused view + export

### 4.2 Glass UI Design System

Use Tailwind + shadcn primitives; enforce these rules:

- **Background**: subtle gradient + noise overlay; content on frosted glass cards
- **Cards**: `backdrop-blur`, semi-transparent fill, soft border, subtle shadow
- **Typography**: restrained, high-contrast, large numeric callouts for "Best price / Fastest"
- **Progress**: vertical stepper with explicit statuses: `CREATED → ANALYZING → CALLING → SUMMARIZING → DONE/FAILED`
- **DEMO Banner**: Always show a persistent banner when `DEMO_MODE=true`: "DEMO MODE — Calls go only to test numbers."

### 4.3 Required User Workflow (Happy Path)

1. User logs in (Auth0)
2. User submits:
   - Location (ZIP/city)
   - Optional car make/model/year
   - Damage description (required)
   - Optional image upload
3. Backend:
   - Generates an image description via Freepik (if image provided)
   - Creates a structured "damage summary" via Claude
4. User selects shops (MVP: user provides or confirms a list)
5. System places parallel calls via Vapi (demo-safe)
6. System receives call results with transcripts from Vapi
7. System summarizes responses and generates report

---

## 5) Architecture (Components)

### 5.1 Services Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js 16 Web (Vercel)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   UI Pages   │  │  API Routes  │  │  Vapi Webhooks       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Mastra Orchestrator (Node)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  OpenRouter  │  │   Freepik    │  │        Vapi          │   │
│  │    Claude    │  │  Img2Prompt  │  │   Voice Agents       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DynamoDB                                │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │   Sessions   │  │    Calls     │                             │
│  └──────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Service Descriptions

**A) Next.js 16 Web (Vercel)**
- Renders UI
- Hosts API routes (route handlers) for:
  - Session creation/read
  - Uploads
  - Start orchestration
  - Report retrieval
  - **Vapi webhooks** (`server.url` callbacks)

**B) Mastra Orchestrator (in-process, Node runtime)**
- Runs in the Next.js backend runtime (Node)
- Owns the workflow state machine and tool calls (OpenRouter, Freepik, Vapi, DynamoDB)

**C) DynamoDB**
- Sessions table (required)
- Calls table (recommended)

**D) Retool (Internal)**
- Reads metrics/events from your backend API
- Visualizes developer analytics

---

## 6) Data Model

### 6.1 DynamoDB Tables

#### Table: `Sessions` (Required)

**Partition key:** `session_id` (string)

| Attribute | Type | Description |
|-----------|------|-------------|
| `user_id` | string | Auth0 user identifier |
| `location` | string | ZIP/city for shop lookup |
| `vehicle` | object | `{ make, model, year }` (all optional) |
| `description_raw` | string | User's damage description |
| `image_keys` | string[] | S3 keys or blob references |
| `image_prompt` | string | Text from Freepik image-to-prompt |
| `damage_summary` | object | Claude-generated structured summary |
| `shops` | object[] | Array of shop objects with name/phone |
| `status` | enum | `CREATED \| ANALYZING \| CALLING \| SUMMARIZING \| DONE \| FAILED` |
| `report` | object | Final structured report JSON |
| `created_at` | string | ISO 8601 timestamp |
| `updated_at` | string | ISO 8601 timestamp |

#### Table: `Calls` (Recommended)

**Partition key:** `session_id`  
**Sort key:** `shop_id`

| Attribute | Type | Description |
|-----------|------|-------------|
| `vapi_call_id` | string | Vapi call identifier |
| `to_number` | string | Destination (must reflect DEMO override) |
| `status` | string | Vapi call status + internal states |
| `transcript` | string | Full call transcript from Vapi |
| `structured_data` | object | Extracted quote data from Vapi analysis |
| `summary` | object | Claude summary object |
| `cost` | number | Vapi call cost |
| `duration_seconds` | number | Call duration |
| `ended_reason` | string | Vapi call end reason |
| `created_at` | string | ISO 8601 timestamp |
| `updated_at` | string | ISO 8601 timestamp |

### 6.2 Shop Discovery (MVP Approach)

To avoid introducing an undocumented dependency in the critical path:

- **MVP**: User provides 3–5 shops (name + phone) or selects from a pre-seeded list
- **Later**: Add automated shop discovery behind a feature flag

---

## 7) LLM Configuration: Claude Opus 4.5 "Thinking" on OpenRouter

### 7.1 Model Identifier and Gateway

```typescript
const OPENROUTER_CONFIG = {
  baseURL: "https://openrouter.ai/api/v1",
  model: "anthropic/claude-opus-4.5",
};
```

### 7.2 Enabling "Thinking" (Extended Thinking)

Enable extended thinking for reasoning-intensive tasks:

```typescript
// Via OpenRouter with extra_body for Anthropic models
const response = await openai.chat.completions.create({
  model: "anthropic/claude-opus-4.5",
  messages: [...],
  // Enable extended thinking via provider-specific params
  extra_body: {
    thinking: {
      type: "enabled",
      budget_tokens: 10000  // Bounded thinking budget
    }
  }
});
```

**Implementation Policy:**

1. Default to "Thinking enabled" for:
   - Damage summary generation
   - Per-call response summarization
   - Final report synthesis
2. Use a bounded thinking budget to prevent runaway cost/time
3. Add a per-environment throttle:
   - Production: moderate budget (5,000–10,000 tokens)
   - Demo: higher budget (15,000+ tokens) to impress judges

### 7.3 Structured Outputs

Use OpenRouter JSON mode for machine-readable outputs:

```typescript
const response = await openai.chat.completions.create({
  model: "anthropic/claude-opus-4.5",
  messages: [...],
  response_format: { type: "json_object" }
});
```

---

## 8) Freepik: Image-to-Prompt Only

### 8.1 Required Behavior

If the user uploads an image of the car:

1. Store it (S3 or equivalent)
2. Send it to Freepik image-to-prompt
3. Store only the textual description back into the session

**No image generation, enhancement, relighting, or modification.**

### 8.2 API Call

```bash
curl --request POST \
  --url https://api.freepik.com/v1/ai/image-to-prompt \
  --header 'Content-Type: application/json' \
  --header 'x-freepik-api-key: <api-key>' \
  --data '{
    "image": "https://your-bucket.s3.amazonaws.com/uploads/car-damage.jpg",
    "webhook_url": "https://your-app.com/webhooks/image-to-prompt"
  }'
```

**Key Requirements:**
- Header: `x-freepik-api-key`
- `image`: Required, can be base64 or URL
- Response returns `task_id` and status (async task)

**Design Choice:** Use webhook completion to avoid polling and keep serverless execution time low.

---

## 9) Vapi: Voice Call Pipeline

### 9.1 High-Level Flow

For each shop (or demo endpoint):

1. **Create Vapi Assistant** (transient or saved) with ElevenLabs voice
2. **Configure System Prompt** with the quote request script
3. **Initiate Outbound Call** via `POST /call`
4. **Receive Webhook Events** for call status updates
5. **Retrieve Artifacts** (transcript, structured data) on call completion

### 9.2 Vapi Assistant Configuration

**HARD REQUIREMENTS:**
- **LLM**: Claude Opus 4.5 with Thinking enabled — **NO OTHER MODEL IS PERMITTED**
- **TTS/Voice**: ElevenLabs — **NO OTHER VOICE PROVIDER IS PERMITTED**

```typescript
/**
 * Vapi assistant configuration for auto repair quote calls.
 * 
 * CRITICAL REQUIREMENTS:
 * - LLM MUST be Claude Opus 4.5 (claude-opus-4-5-20251101) with Thinking ENABLED
 * - Voice MUST be ElevenLabs (provider: "11labs")
 * - NO OTHER MODELS OR VOICE PROVIDERS ARE PERMITTED
 * - Sonnet, Haiku, GPT-4o, GPT-4o-mini, Gemini, Llama are ALL FORBIDDEN
 */
type VapiAssistantConfig = {
  /** First message the assistant speaks when call connects */
  firstMessage: string;
  
  /**
   * LLM configuration — MUST use Claude Opus 4.5 with Thinking.
   * DO NOT use Sonnet, Haiku, OpenAI, Google, or any other provider/model.
   */
  model: {
    provider: "anthropic";                    // REQUIRED: Must be "anthropic"
    model: "claude-opus-4-5-20251101";        // REQUIRED: Claude Opus 4.5 ONLY
    thinking: {                               // REQUIRED: Thinking must be enabled
      type: "enabled";
      budgetTokens: number;                   // Token budget for reasoning
    };
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    temperature?: number;
    maxTokens?: number;
  };
  
  /**
   * Voice configuration — MUST use ElevenLabs.
   * DO NOT use Azure, PlayHT, Deepgram, or any other voice provider.
   */
  voice: {
    provider: "11labs";  // REQUIRED: Must be "11labs" (ElevenLabs)
    voiceId: string;     // REQUIRED: ElevenLabs voice ID
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
  
  /** Transcription configuration */
  transcriber?: {
    provider: "deepgram" | "assembly-ai";
    language?: string;
  };
  
  /** Analysis plan for extracting structured data from calls */
  analysisPlan?: {
    structuredDataPlan?: {
      enabled: boolean;
      schema: object;
    };
    summaryPlan?: {
      enabled: boolean;
    };
  };
  
  /** Call recording and artifact settings */
  artifactPlan?: {
    recordingEnabled?: boolean;
    transcriptPlan?: {
      enabled: boolean;
    };
  };
  
  /** Server URL for webhook events */
  server?: {
    url: string;
    headers?: Record<string, string>;
  };
  
  /** Maximum call duration in seconds */
  maxDurationSeconds?: number;
  
  /** End call phrases that trigger call termination */
  endCallPhrases?: string[];
};

const assistantConfig: VapiAssistantConfig = {
  firstMessage: "Hi, I'm calling to get a repair estimate for some car damage. Do you have a moment to help me?",
  
  // ============================================================
  // LLM CONFIGURATION — CLAUDE OPUS 4.5 WITH THINKING ONLY
  // ============================================================
  model: {
    provider: "anthropic",                    // REQUIRED: Anthropic only
    model: "claude-opus-4-5-20251101",        // REQUIRED: Claude Opus 4.5 ONLY
    thinking: {                               // REQUIRED: Thinking MUST be enabled
      type: "enabled",
      budgetTokens: 10000                     // Reasoning token budget
    },
    messages: [{
      role: "system",
      content: `You are a friendly customer calling an auto repair shop to get a quote.

DAMAGE DESCRIPTION:
{{damage_summary}}

VEHICLE INFO:
{{vehicle_info}}

YOUR TASK:
1. Politely introduce yourself and explain you need a repair estimate
2. Describe the damage clearly and concisely
3. Ask for their best estimate (price range and timeframe)
4. Thank them and end the call professionally

IMPORTANT:
- Be conversational and natural
- If they ask clarifying questions, answer based on the damage description
- If they can't give an estimate over the phone, ask what information they'd need
- Keep the call under 3 minutes
- End with "Thank you for your time, goodbye" when done`
    }],
    temperature: 0.7,
    maxTokens: 2048
  },
  
  // ============================================================
  // VOICE CONFIGURATION — ELEVENLABS ONLY
  // ============================================================
  voice: {
    provider: "11labs",                       // REQUIRED: ElevenLabs only
    voiceId: "21m00Tcm4TlvDq8ikWAM",          // Rachel voice (ElevenLabs)
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.0,
    useSpeakerBoost: true
  },
  
  transcriber: {
    provider: "deepgram",
    language: "en-US"
  },
  
  analysisPlan: {
    structuredDataPlan: {
      enabled: true,
      schema: {
        type: "object",
        properties: {
          quote_provided: { type: "boolean" },
          price_estimate_low: { type: "number" },
          price_estimate_high: { type: "number" },
          timeframe_days: { type: "number" },
          requires_inspection: { type: "boolean" },
          shop_can_do_work: { type: "boolean" },
          notes: { type: "string" }
        },
        required: ["quote_provided", "shop_can_do_work"]
      }
    },
    summaryPlan: {
      enabled: true
    }
  },
  
  artifactPlan: {
    recordingEnabled: true,
    transcriptPlan: {
      enabled: true
    }
  },
  
  server: {
    url: "https://your-app.com/api/vapi/webhook"
  },
  
  maxDurationSeconds: 300,  // 5 minute max
  
  endCallPhrases: [
    "goodbye",
    "thank you for your time",
    "have a great day"
  ]
};

/**
 * Validates that the assistant configuration meets HARD REQUIREMENTS.
 * 
 * CRITICAL: This function MUST be called before creating any Vapi call.
 * 
 * @param config - The assistant configuration to validate
 * @throws Error if ElevenLabs is not the voice provider
 * @throws Error if model is not Claude Opus 4.5
 * @throws Error if Thinking is not enabled
 */
function validateAssistantConfig(config: VapiAssistantConfig): void {
  // ============================================================
  // HARD REQUIREMENT: ElevenLabs ONLY for voice
  // ============================================================
  if (config.voice.provider !== "11labs") {
    throw new Error(
      `SPEC VIOLATION: Voice provider must be "11labs" (ElevenLabs). ` +
      `Received: "${config.voice.provider}". ` +
      `Other voice providers (Azure, PlayHT, Deepgram, etc.) are FORBIDDEN.`
    );
  }
  
  // ============================================================
  // HARD REQUIREMENT: Anthropic provider ONLY
  // ============================================================
  if (config.model.provider !== "anthropic") {
    throw new Error(
      `SPEC VIOLATION: Model provider must be "anthropic". ` +
      `Received: "${config.model.provider}". ` +
      `Other LLM providers (OpenAI, Google, etc.) are FORBIDDEN.`
    );
  }
  
  // ============================================================
  // HARD REQUIREMENT: Claude Opus 4.5 ONLY (no Sonnet, Haiku, old Opus)
  // ============================================================
  const REQUIRED_MODEL = "claude-opus-4-5-20251101";
  
  if (config.model.model !== REQUIRED_MODEL) {
    throw new Error(
      `SPEC VIOLATION: Model must be "${REQUIRED_MODEL}" (Claude Opus 4.5). ` +
      `Received: "${config.model.model}". ` +
      `Other models (Sonnet, Haiku, old Opus, GPT, Gemini, etc.) are FORBIDDEN.`
    );
  }
  
  // ============================================================
  // HARD REQUIREMENT: Thinking MUST be enabled
  // ============================================================
  if (!config.model.thinking || config.model.thinking.type !== "enabled") {
    throw new Error(
      `SPEC VIOLATION: Thinking must be enabled for Claude Opus 4.5. ` +
      `Received thinking config: ${JSON.stringify(config.model.thinking)}. ` +
      `Set thinking.type to "enabled" with a budgetTokens value.`
    );
  }
  
  if (typeof config.model.thinking.budgetTokens !== "number" || config.model.thinking.budgetTokens <= 0) {
    throw new Error(
      `SPEC VIOLATION: thinking.budgetTokens must be a positive number. ` +
      `Received: ${config.model.thinking.budgetTokens}.`
    );
  }
  
  console.log("✓ Assistant config validated: ElevenLabs voice + Claude Opus 4.5 (Thinking enabled)");
}
  
  console.log("✓ Assistant config validated: ElevenLabs voice + Claude LLM");
}
```

### 9.3 Outbound Call Creation

```typescript
/**
 * Creates an outbound call via Vapi API.
 * 
 * CRITICAL: This function enforces THREE mandatory requirements:
 * 1. DEMO_MODE number restrictions
 * 2. ElevenLabs as the ONLY voice provider
 * 3. Claude (Anthropic) as the ONLY conversation LLM
 * 
 * @param sessionId - The session identifier for this quote request
 * @param shop - The shop to call
 * @param damageSummary - Structured damage summary to inject into assistant prompt
 * @param vehicleInfo - Vehicle information string
 * @returns Vapi call response with call ID
 * @throws Error if non-demo number attempted in DEMO_MODE
 * @throws Error if voice provider is not ElevenLabs
 * @throws Error if LLM provider is not Anthropic/Claude
 */
async function createOutboundCall(
  sessionId: string,
  shop: Shop,
  damageSummary: string,
  vehicleInfo: string
): Promise<VapiCallResponse> {
  // CRITICAL: DEMO_MODE enforcement
  const targetNumber = enforceDemoMode(shop.phone);
  
  // Build the assistant config with session-specific data
  const callAssistantConfig: VapiAssistantConfig = {
    ...assistantConfig,
    model: {
      ...assistantConfig.model,
      messages: [{
        role: "system",
        content: assistantConfig.model.messages[0].content
          .replace("{{damage_summary}}", damageSummary)
          .replace("{{vehicle_info}}", vehicleInfo)
      }]
    },
    // Include session metadata for webhook correlation
    metadata: {
      session_id: sessionId,
      shop_id: shop.id,
      shop_name: shop.name
    }
  };
  
  // ============================================================
  // CRITICAL: Validate assistant config meets HARD REQUIREMENTS
  // - ElevenLabs ONLY for voice
  // - Claude (Anthropic) ONLY for LLM
  // ============================================================
  validateAssistantConfig(callAssistantConfig);
  
  const response = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.VAPI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      // Use transient assistant for per-call customization
      assistant: callAssistantConfig,
      
      // Phone number to call FROM (your Vapi number)
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      
      // Customer (shop) to call
      customer: {
        number: targetNumber,
        name: shop.name
      }
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Vapi call creation failed: ${JSON.stringify(error)}`);
  }
  
  return response.json();
}
```

### 9.4 DEMO_MODE Enforcement (CRITICAL)

```typescript
/**
 * Enforces DEMO_MODE number restrictions.
 * 
 * CRITICAL SAFETY FUNCTION - This MUST be called before ANY Vapi call creation.
 * 
 * @param originalNumber - The original phone number requested
 * @returns The number to actually dial (demo number if DEMO_MODE, original otherwise)
 * @throws Error if DEMO_MODE is enabled and original number is not in allowlist
 */
function enforceDemoMode(originalNumber: string): string {
  const isDemoMode = process.env.DEMO_MODE === "true";
  const scopeToDemo = process.env.SCOPE_CALLS_TO_DEMO_LIST === "true";
  const demoNumbers = (process.env.DEMO_TO_NUMBERS || "").split(",").map(n => n.trim());
  const strategy = process.env.DEMO_NUMBER_STRATEGY || "round-robin";
  
  if (!isDemoMode) {
    return originalNumber;
  }
  
  // Check if original number is in demo allowlist
  if (demoNumbers.includes(originalNumber)) {
    return originalNumber;
  }
  
  // CRITICAL: Block non-demo numbers
  if (scopeToDemo) {
    console.error(`BLOCKED: Attempted to call non-demo number ${originalNumber} in DEMO_MODE`);
    throw new Error(`DEMO_MODE violation: Cannot call ${originalNumber}. Only demo numbers allowed.`);
  }
  
  // Replace with demo number based on strategy
  if (strategy === "round-robin") {
    const index = Math.floor(Math.random() * demoNumbers.length);
    const replacement = demoNumbers[index];
    console.warn(`DEMO_MODE: Replacing ${originalNumber} with ${replacement}`);
    return replacement;
  }
  
  // Default: use first demo number
  const replacement = demoNumbers[0];
  console.warn(`DEMO_MODE: Replacing ${originalNumber} with ${replacement}`);
  return replacement;
}
```

### 9.5 Batch Calling (Parallel Calls)

```typescript
/**
 * Creates multiple outbound calls in batch via Vapi.
 * Vapi supports the `customers` array for batch calling.
 * 
 * @param sessionId - Session identifier
 * @param shops - Array of shops to call
 * @param damageSummary - Damage summary for assistant
 * @param vehicleInfo - Vehicle information
 * @returns Array of Vapi call responses
 */
async function createBatchCalls(
  sessionId: string,
  shops: Shop[],
  damageSummary: string,
  vehicleInfo: string
): Promise<VapiCallResponse[]> {
  // Enforce DEMO_MODE for all numbers
  const customers = shops.map(shop => ({
    number: enforceDemoMode(shop.phone),
    name: shop.name
  }));
  
  // Note: Vapi batch calling uses `customers` array
  // For per-shop assistant overrides, we call the endpoint separately per shop
  const callPromises = shops.map(shop => 
    createOutboundCall(sessionId, shop, damageSummary, vehicleInfo)
  );
  
  return Promise.all(callPromises);
}
```

### 9.6 Vapi Webhook Handler

```typescript
/**
 * Vapi webhook event types relevant to our use case.
 */
type VapiWebhookEvent = {
  type: 
    | "call.started"
    | "call.ended"
    | "call.failed"
    | "assistant-message"
    | "user-message"
    | "transcript"
    | "status-update";
  call?: {
    id: string;
    status: string;
    endedReason?: string;
    cost?: number;
    costBreakdown?: {
      transport: number;
      stt: number;
      llm: number;
      tts: number;
      vapi: number;
      total: number;
    };
    artifact?: {
      transcript?: string;
      messages?: Array<{
        role: string;
        message: string;
        time: number;
      }>;
      recordingUrl?: string;
    };
    analysis?: {
      summary?: string;
      structuredData?: {
        quote_provided?: boolean;
        price_estimate_low?: number;
        price_estimate_high?: number;
        timeframe_days?: number;
        requires_inspection?: boolean;
        shop_can_do_work?: boolean;
        notes?: string;
      };
    };
  };
  // Metadata we passed when creating the call
  assistant?: {
    metadata?: {
      session_id: string;
      shop_id: string;
      shop_name: string;
    };
  };
};

/**
 * Handles Vapi webhook events.
 * 
 * @param event - The webhook event from Vapi
 */
async function handleVapiWebhook(event: VapiWebhookEvent): Promise<void> {
  const metadata = event.assistant?.metadata;
  
  if (!metadata) {
    console.error("Webhook missing metadata:", event);
    return;
  }
  
  const { session_id, shop_id, shop_name } = metadata;
  
  switch (event.type) {
    case "call.started":
      await updateCallRecord(session_id, shop_id, {
        status: "IN_PROGRESS",
        vapi_call_id: event.call?.id,
        updated_at: new Date().toISOString()
      });
      break;
      
    case "call.ended":
      const call = event.call;
      await updateCallRecord(session_id, shop_id, {
        status: "COMPLETED",
        transcript: call?.artifact?.transcript,
        structured_data: call?.analysis?.structuredData,
        summary: call?.analysis?.summary,
        cost: call?.cost,
        duration_seconds: calculateDuration(call),
        ended_reason: call?.endedReason,
        recording_url: call?.artifact?.recordingUrl,
        updated_at: new Date().toISOString()
      });
      
      // Check if all calls for this session are complete
      await checkSessionCompletion(session_id);
      break;
      
    case "call.failed":
      await updateCallRecord(session_id, shop_id, {
        status: "FAILED",
        ended_reason: event.call?.endedReason,
        updated_at: new Date().toISOString()
      });
      break;
      
    default:
      console.log(`Unhandled webhook event type: ${event.type}`);
  }
}
```

### 9.7 ElevenLabs Voice Configuration via Vapi (MANDATORY)

> **⚠️ HARD REQUIREMENT:** ElevenLabs is the ONLY permitted voice/TTS provider. Do NOT use Azure, PlayHT, Deepgram TTS, Cartesia, or any other voice provider.

To use ElevenLabs voices in Vapi:

1. **Add ElevenLabs API key to Vapi Dashboard:**
   - Navigate to Vapi Dashboard → Settings → Integrations
   - Input your ElevenLabs API key under the ElevenLabs section
   - Save to sync your voice library

2. **Configure voice in assistant (MUST use provider "11labs"):**
```typescript
// ============================================================
// VOICE CONFIGURATION — ELEVENLABS ONLY (MANDATORY)
// ============================================================
voice: {
  provider: "11labs",                       // REQUIRED: MUST be "11labs"
  voiceId: "21m00Tcm4TlvDq8ikWAM",          // ElevenLabs voice ID
  stability: 0.5,                           // 0-1, lower = more expressive
  similarityBoost: 0.75,                    // 0-1, higher = more similar to original
  style: 0.0,                               // 0-1, style exaggeration
  useSpeakerBoost: true                     // Enhanced clarity
}

// ❌ FORBIDDEN — Do NOT use these providers:
// voice: { provider: "azure", ... }        // FORBIDDEN
// voice: { provider: "playht", ... }       // FORBIDDEN
// voice: { provider: "deepgram", ... }     // FORBIDDEN
// voice: { provider: "cartesia", ... }     // FORBIDDEN
// voice: { provider: "rime-ai", ... }      // FORBIDDEN
```

3. **Recommended ElevenLabs Voice IDs:**
   - `21m00Tcm4TlvDq8ikWAM` — Rachel (female, calm) — **DEFAULT**
   - `AZnzlk1XvdvUeBnXmlld` — Domi (female, confident)
   - `EXAVITQu4vr4xnSDxMaL` — Bella (female, soft)
   - `ErXwobaYiN019PkySvjV` — Antoni (male, expressive)
   - `VR6AewLTigWG4xSOukaG` — Arnold (male, deep)

### 9.8 Claude Opus 4.5 (Thinking) LLM Configuration via Vapi (MANDATORY)

> **⚠️ HARD REQUIREMENT:** Claude Opus 4.5 with Thinking enabled is the **ONLY** permitted LLM for the Vapi assistant conversation. Do NOT use Sonnet, Haiku, GPT-4o, GPT-4o-mini, Gemini, Llama, or any other model.

```typescript
// ============================================================
// LLM CONFIGURATION — CLAUDE OPUS 4.5 WITH THINKING ONLY (MANDATORY)
// ============================================================
model: {
  provider: "anthropic",                    // REQUIRED: MUST be "anthropic"
  model: "claude-opus-4-5-20251101",        // REQUIRED: Claude Opus 4.5 ONLY
  thinking: {                               // REQUIRED: Thinking MUST be enabled
    type: "enabled",
    budgetTokens: 10000                     // Reasoning token budget
  },
  messages: [{ role: "system", content: "..." }],
  temperature: 0.7,
  maxTokens: 2048
}

// ❌ FORBIDDEN — Do NOT use these providers/models:
// model: { provider: "anthropic", model: "claude-3-5-sonnet-...", ... }  // FORBIDDEN
// model: { provider: "anthropic", model: "claude-3-sonnet-...", ... }    // FORBIDDEN
// model: { provider: "anthropic", model: "claude-3-haiku-...", ... }     // FORBIDDEN
// model: { provider: "anthropic", model: "claude-3-opus-...", ... }      // FORBIDDEN (old Opus)
// model: { provider: "openai", model: "gpt-4o-mini", ... }               // FORBIDDEN
// model: { provider: "openai", model: "gpt-4o", ... }                    // FORBIDDEN
// model: { provider: "google", model: "gemini-...", ... }                // FORBIDDEN
// model: { provider: "together-ai", model: "llama-...", ... }            // FORBIDDEN
// model: { provider: "groq", model: "...", ... }                         // FORBIDDEN

// ❌ FORBIDDEN — Thinking MUST be enabled:
// model: { ..., thinking: { type: "disabled" }, ... }                    // FORBIDDEN
// model: { ..., /* no thinking config */ }                               // FORBIDDEN
```

**The ONLY Permitted Model:**
- `claude-opus-4-5-20251101` — Claude Opus 4.5 with `thinking.type: "enabled"` — **MANDATORY**

---

## 10) Mastra Orchestration (Authoritative Workflow)

Implement the orchestrator as a deterministic state machine (backed by DynamoDB), with Mastra coordinating tool calls.

### 10.1 Workflow States

```
CREATED → ANALYZING → CALLING → SUMMARIZING → DONE
              │           │           │
              └───────────┴───────────┴──→ FAILED
```

| State | Description |
|-------|-------------|
| `CREATED` | Session initialized, awaiting user input |
| `ANALYZING` | Running Freepik image-to-prompt + Claude damage summary |
| `CALLING` | Parallel Vapi calls in progress |
| `SUMMARIZING` | All calls complete, Claude generating final report |
| `DONE` | Report ready for user |
| `FAILED` | Unrecoverable error occurred |

### 10.2 Mastra Tool Wrappers

```typescript
/**
 * Mastra tool definitions for AutoQuote AI workflow.
 */
const tools = {
  /**
   * Calls Freepik Image-to-Prompt API.
   */
  freepikImageToPrompt: async (imageUrl: string): Promise<string> => { /* ... */ },
  
  /**
   * Calls Claude via OpenRouter with optional extended thinking.
   */
  openrouterClaude: async (
    messages: Message[],
    responseFormat?: ResponseFormat,
    thinkingConfig?: ThinkingConfig
  ): Promise<ClaudeResponse> => { /* ... */ },
  
  /**
   * Creates a Vapi outbound call.
   * CRITICAL: Must call enforceDemoMode internally.
   */
  vapiCreateCall: async (
    sessionId: string,
    shop: Shop,
    assistantConfig: VapiAssistantConfig
  ): Promise<VapiCallResponse> => { /* ... */ },
  
  /**
   * Retrieves a completed Vapi call's artifacts.
   */
  vapiGetCall: async (callId: string): Promise<VapiCall> => { /* ... */ },
  
  /**
   * DynamoDB operations.
   */
  ddbPut: async (table: string, item: object): Promise<void> => { /* ... */ },
  ddbUpdate: async (table: string, key: object, updates: object): Promise<void> => { /* ... */ },
  ddbGet: async (table: string, key: object): Promise<object | null> => { /* ... */ },
};
```

### 10.3 Main Workflow: `RunQuoteSession`

```typescript
/**
 * Main workflow for running a quote session.
 * 
 * @param sessionId - The session to process
 */
async function runQuoteSession(sessionId: string): Promise<void> {
  const session = await tools.ddbGet("Sessions", { session_id: sessionId });
  
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  
  try {
    // Step 1: Analyze (if needed)
    if (session.status === "CREATED") {
      await updateSessionStatus(sessionId, "ANALYZING");
      
      // Generate image description if image exists
      if (session.image_keys?.length > 0 && !session.image_prompt) {
        const imageUrl = await getSignedUrl(session.image_keys[0]);
        const imagePrompt = await tools.freepikImageToPrompt(imageUrl);
        await tools.ddbUpdate("Sessions", { session_id: sessionId }, {
          image_prompt: imagePrompt
        });
      }
      
      // Generate damage summary with Claude
      const damageSummary = await generateDamageSummary(session);
      await tools.ddbUpdate("Sessions", { session_id: sessionId }, {
        damage_summary: damageSummary
      });
    }
    
    // Step 2: Call shops
    if (["CREATED", "ANALYZING"].includes(session.status)) {
      await updateSessionStatus(sessionId, "CALLING");
      
      const refreshedSession = await tools.ddbGet("Sessions", { session_id: sessionId });
      
      // Create call records and initiate Vapi calls
      for (const shop of refreshedSession.shops) {
        await tools.ddbPut("Calls", {
          session_id: sessionId,
          shop_id: shop.id,
          status: "PENDING",
          to_number: enforceDemoMode(shop.phone),
          created_at: new Date().toISOString()
        });
        
        await tools.vapiCreateCall(
          sessionId,
          shop,
          buildAssistantConfig(refreshedSession)
        );
      }
      
      // Vapi webhooks will update call records as calls complete
      // The webhook handler will call checkSessionCompletion() when all calls are done
    }
    
  } catch (error) {
    console.error(`Session ${sessionId} failed:`, error);
    await updateSessionStatus(sessionId, "FAILED");
    throw error;
  }
}

/**
 * Checks if all calls for a session are complete and triggers summarization.
 */
async function checkSessionCompletion(sessionId: string): Promise<void> {
  const calls = await getCallsForSession(sessionId);
  const allComplete = calls.every(c => 
    ["COMPLETED", "FAILED"].includes(c.status)
  );
  
  if (allComplete) {
    await updateSessionStatus(sessionId, "SUMMARIZING");
    await generateFinalReport(sessionId, calls);
    await updateSessionStatus(sessionId, "DONE");
  }
}
```

---

## 11) Backend API Contract

### 11.1 Frontend-Facing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/sessions` | Create new session |
| `GET` | `/api/v1/sessions/{session_id}` | Get session status and data |
| `POST` | `/api/v1/sessions/{session_id}/upload` | Upload damage image |
| `POST` | `/api/v1/sessions/{session_id}/start` | Start quote workflow |
| `GET` | `/api/v1/sessions/{session_id}/report` | Get final report |

### 11.2 Vapi Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/vapi/webhook` | Receives all Vapi call events |

**Webhook Validation:**
```typescript
// Validate Vapi webhook signature (if configured)
function validateVapiWebhook(req: Request): boolean {
  const signature = req.headers.get("x-vapi-signature");
  const body = await req.text();
  const expectedSignature = crypto
    .createHmac("sha256", process.env.VAPI_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");
  return signature === expectedSignature;
}
```

---

## 12) DynamoDB Write Patterns

### 12.1 Idempotent Creates

Use conditional writes to prevent accidental overwrites:

```typescript
await dynamodb.put({
  TableName: "Sessions",
  Item: session,
  ConditionExpression: "attribute_not_exists(session_id)"
}).promise();
```

### 12.2 Event Sourcing (Recommended)

Write an append-only "events" list (or a separate table) for:

- Session created
- Image described
- Call started
- Call completed
- Response summarized
- Report generated

This makes Retool analytics trivial and debugging far faster.

---

## 13) Retool (Developer Analytics Only)

### 13.1 What Retool Is Allowed to Do

- Show sessions list, filter by status, inspect errors
- Show call metrics: duration, completion rate, per-session cost estimates
- Show LLM usage approximations (tokens, latency) logged by your backend
- **Show Vapi call costs** from `costBreakdown` data

### 13.2 What Retool Is NOT Allowed to Do

- No consumer-facing UI
- No primary workflow for session creation/report viewing

---

## 14) Environment Variables

### 14.1 Auth0

```env
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_AUDIENCE=https://api.autoquote.ai
AUTH0_CALLBACK_URL=https://autoquote.ai/api/auth/callback
```

### 14.2 OpenRouter + Claude

```env
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=anthropic/claude-opus-4.5
CLAUDE_THINKING_BUDGET_TOKENS=10000
CLAUDE_REASONING_EFFORT=high
```

### 14.3 Freepik

```env
FREEPIK_API_KEY=fpk_...
FREEPIK_WEBHOOK_URL=https://autoquote.ai/api/webhooks/image-to-prompt
```

### 14.4 Vapi (NEW)

```env
# Vapi API credentials
VAPI_API_KEY=your_vapi_api_key
VAPI_PHONE_NUMBER_ID=your_vapi_phone_number_id
VAPI_WEBHOOK_SECRET=your_webhook_secret

# REQUIRED MODEL: Claude Opus 4.5 with Thinking (hardcoded in assistant config)
# Model: claude-opus-4-5-20251101
# Thinking: enabled with budgetTokens

# ElevenLabs (configured in Vapi dashboard, but listed for reference)
# REQUIRED: ElevenLabs is the ONLY permitted voice provider
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

### 14.5 DynamoDB / Storage

```env
AWS_REGION=us-east-1
DYNAMODB_TABLE_SESSIONS=autoquote-sessions
DYNAMODB_TABLE_CALLS=autoquote-calls
S3_BUCKET_MEDIA=autoquote-media
```

### 14.6 DEMO Safety Switches (MANDATORY)

```env
# CRITICAL: All of these must be set for safe demo operation
DEMO_MODE=true
DEMO_TO_NUMBERS=+15551234567,+15559876543
DEMO_NUMBER_STRATEGY=round-robin
SCOPE_CALLS_TO_DEMO_LIST=true
ALLOW_OUTBOUND_CALLS=true
```

| Variable | Description |
|----------|-------------|
| `DEMO_MODE` | If `true`, enables all demo safety features |
| `DEMO_TO_NUMBERS` | Comma-separated list of allowed demo phone numbers |
| `DEMO_NUMBER_STRATEGY` | `round-robin` or `first` for replacement strategy |
| `SCOPE_CALLS_TO_DEMO_LIST` | If `true`, throws error on non-demo numbers |
| `ALLOW_OUTBOUND_CALLS` | Master switch; if `false`, no calls are made |

---

## 15) Step-by-Step Implementation Plan

### Phase 1: Foundation (Days 1-2)

1. **Create Next.js 16 app**
   ```bash
   npx create-next-app@latest autoquote --typescript --tailwind --app
   ```

2. **Install dependencies**
   ```bash
   npm install @auth0/nextjs-auth0 @aws-sdk/client-dynamodb \
     @aws-sdk/lib-dynamodb openai zod
   ```

3. **Initialize shadcn/ui + glass tokens**
   ```bash
   npx shadcn-ui@latest init
   ```

4. **Build core components:**
   - `GlassCard`
   - `StatusStepper`
   - `ShopListEditor`
   - `CallLogTable`
   - `ReportComparisonPanel`

### Phase 2: Backend Infrastructure (Days 3-4)

5. **Auth0 integration**
   - Protected routes for sessions/report pages

6. **DynamoDB setup**
   - Create `Sessions` and `Calls` tables
   - Implement `SessionsRepository` and `CallsRepository`
   - Use conditional writes for create flows

7. **S3 setup for uploads**
   - Presigned URL generation
   - Image upload handling

### Phase 3: External Integrations (Days 5-6)

8. **Freepik webhook + image-to-prompt**
   - `POST /api/v1/sessions/{id}/upload` stores image and triggers Freepik task
   - `POST /api/webhooks/image-to-prompt` receives completion

9. **OpenRouter + Claude integration**
   - Damage summary generation
   - Extended thinking configuration

10. **Vapi integration**
    - Add ElevenLabs API key to Vapi dashboard
    - Import/create phone number in Vapi
    - Create assistant template
    - Implement webhook handler

### Phase 4: Orchestration (Days 7-8)

11. **Mastra workflow implementation**
    - State machine with DynamoDB backing
    - Tool wrappers for all external services
    - DEMO_MODE enforcement at call creation

12. **Vapi webhook handlers**
    - Call status updates
    - Transcript/structured data extraction
    - Session completion detection

### Phase 5: Report Generation (Days 9-10)

13. **Report synthesis**
    - Claude summarization of all call results
    - Ranking by price/time
    - Best pick recommendation

14. **Report UI**
    - Glass card comparison layout
    - Export functionality (PDF/print)

### Phase 6: Testing & Polish (Days 11-12)

15. **End-to-end testing**
    - Demo mode verification
    - Error handling
    - Edge cases

16. **Retool dashboards**
    - Session monitoring
    - Call metrics
    - Cost tracking

---

## 16) Demo Script (Judge-Friendly)

1. **Show the Next.js glass UI** and explain that Retool is internal-only

2. **Create a session**, upload a car image, show the "Image description" field populate (Freepik)

3. **Start session in DEMO_MODE**; show banner confirming demo safety

4. **Watch parallel calls fire**; teammates answer with realistic price/time (Vapi handles the conversation)

5. **Refresh session page**: show call log updates with Vapi transcripts

6. **Show final report** with:
   - Ranked list of shops
   - Best pick by price/time
   - Call transcripts and summaries
   - Disclaimers ("rough quotes, verify with shop")

7. **Highlight key technical features:**
   - **Claude Opus 4.5 "Thinking"** — extended reasoning for superior conversation quality
   - **Claude Opus 4.5 powering real-time Vapi conversations** (the ONLY permitted LLM)
   - Vapi's real-time transcription
   - **ElevenLabs natural voice quality** (the ONLY permitted TTS)
   - Parallel call orchestration

---

## 17) Key "Gotchas" to Implement Up Front

### HARD REQUIREMENTS (Violations Are Spec Failures)

| Requirement | Enforcement |
|-------------|-------------|
| **ElevenLabs is the ONLY voice provider** | Vapi `voice.provider` MUST be `"11labs"` — reject any other value |
| **Claude Opus 4.5 is the ONLY LLM** | Vapi `model.model` MUST be `"claude-opus-4-5-20251101"` — reject Sonnet, Haiku, GPT, etc. |
| **Thinking MUST be enabled** | Vapi `model.thinking.type` MUST be `"enabled"` with a valid `budgetTokens` value |
| **DEMO_MODE number enforcement** | All destination numbers MUST pass through `enforceDemoMode()` |

### Vapi-Specific

| Issue | Solution |
|-------|----------|
| Vapi webhook URL must be publicly reachable | Use ngrok or similar for local dev; deploy to Vercel for prod |
| ElevenLabs voices must be synced to Vapi | Add API key in Vapi dashboard before using voices |
| Vapi free numbers have limited outbound calls | Import a Twilio/Vonage number for production scale |
| Call metadata for webhook correlation | Always include `session_id` and `shop_id` in `assistant.metadata` |

### General

| Issue | Solution |
|-------|----------|
| DEMO_MODE bypass attempts | Validate at multiple layers; log all attempts |
| Async Freepik image-to-prompt | Use webhooks; don't block user flows on polling |
| Reasoning budget runaway | Bound `thinking.budget_tokens` per environment |
| DynamoDB race conditions | Use conditional writes with `attribute_not_exists()` |

---

## 18) API Reference Summary

### Vapi Create Call

```http
POST https://api.vapi.ai/call
Authorization: Bearer <VAPI_API_KEY>
Content-Type: application/json

{
  "assistant": { /* transient assistant config */ },
  "assistantId": "saved-assistant-id",  // OR use this
  "phoneNumberId": "your-phone-number-id",
  "customer": {
    "number": "+1234567890",
    "name": "Shop Name"
  },
  "customers": [/* array for batch calls */],
  "schedulePlan": {
    "earliestAt": "2025-01-20T10:00:00Z",
    "latestAt": "2025-01-20T12:00:00Z"
  }
}
```

### Vapi Get Call

```http
GET https://api.vapi.ai/call/{call_id}
Authorization: Bearer <VAPI_API_KEY>
```

### Vapi List Calls

```http
GET https://api.vapi.ai/call
Authorization: Bearer <VAPI_API_KEY>
```

---

## 19) Cost Estimation

### Per Call Costs (Approximate)

| Component | Cost |
|-----------|------|
| Vapi Platform | ~$0.05/min |
| ElevenLabs TTS (via Vapi) | Included in Vapi pricing (or BYO key) |
| Claude Opus 4.5 (Thinking) conversation LLM | ~$0.10-0.15/min (includes thinking tokens) |
| Transcription | Included in Vapi pricing |
| Claude Opus 4.5 (Thinking) post-call summary | ~$0.05 per call summary |

### Per Session Estimate (5 shops, 3 min avg per call)

```
Vapi (includes ElevenLabs): 5 calls × 3 min × $0.05 = $0.75
Claude Opus 4.5 conversation LLM: 5 calls × 3 min × $0.12 = $1.80
Claude Opus 4.5 summaries: 5 × $0.05 = $0.25
Claude Opus 4.5 final report: $0.10
Freepik image-to-prompt: $0.01
---
Total: ~$2.91 per session
```

> **Note:** Claude Opus 4.5 with Thinking enabled is significantly more expensive than smaller models, but this is a **HARD REQUIREMENT** per the spec. The superior reasoning capabilities and conversation quality are essential for accurate quote extraction.

---

## 20) References

- **Vapi Documentation:** https://docs.vapi.ai
- **Vapi Outbound Calling:** https://docs.vapi.ai/calls/outbound-calling
- **Vapi Create Call API:** https://docs.vapi.ai/api-reference/calls/create
- **Vapi ElevenLabs Integration:** https://docs.vapi.ai/customization/custom-voices/elevenlabs
- **OpenRouter:** https://openrouter.ai/anthropic/claude-opus-4.5
- **Mastra:** https://mastra.ai/docs/agents/overview
- **Next.js 16:** https://nextjs.org/blog/next-16
- **shadcn/ui:** https://ui.shadcn.com/docs/installation/next
- **Freepik Image-to-Prompt:** https://docs.freepik.com/api-reference/image-to-prompt/post-image-to-prompt
- **Claude Extended Thinking:** https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking

---

*End of Specification*
