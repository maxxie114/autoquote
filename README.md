# AutoQuote AI

AI-powered auto repair quote comparison. Upload a photo of your car damage, and our AI will call multiple shops simultaneously to get you the best quotes.

## 🚀 Features

- **AI Damage Analysis**: Upload a photo and our AI analyzes the damage
- **Parallel Shop Calling**: AI calls multiple shops simultaneously via Vapi
- **Smart Quote Extraction**: Automatically extracts price, timeframe, and availability
- **Comparison Reports**: Get a detailed comparison with recommendations

## 🛡️ Safety Features

This application includes critical safety features to prevent accidental real calls during demos:

- **DEMO_MODE**: When enabled, all calls are restricted to test numbers only
- **HARD REQUIREMENTS**: Voice calls MUST use ElevenLabs and Claude Opus 4.5 (Thinking)
- **Validation**: Config is validated before every call to ensure spec compliance

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
- **Voice AI**: Vapi with ElevenLabs TTS
- **LLM**: Claude Opus 4.5 via OpenRouter (with Extended Thinking)
- **Image Analysis**: Freepik Image-to-Prompt API
- **Authentication**: Auth0
- **Database**: AWS DynamoDB
- **Storage**: AWS S3
- **Orchestration**: Mastra

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/autoquote.git
   cd autoquote
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

4. Fill in your environment variables (see Configuration below)

5. Run the development server:
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

### Required Environment Variables

See `.env.example` for all required variables. Key configurations:

#### Auth0
- Create a Regular Web Application in Auth0
- Set callback URL to `http://localhost:3000/api/auth/callback`
- Set logout URL to `http://localhost:3000`

#### OpenRouter
- Sign up at [openrouter.ai](https://openrouter.ai)
- Get an API key with Claude Opus 4.5 access
- Set `OPENROUTER_MODEL=anthropic/claude-opus-4.5`

#### Vapi
- Sign up at [vapi.ai](https://vapi.ai)
- Add an ElevenLabs API key in your Vapi dashboard
- Import or purchase a phone number
- Get your API key and phone number ID

#### AWS
- Create DynamoDB tables:
  - `autoquote-sessions` (partition key: `session_id`)
  - `autoquote-calls` (partition key: `session_id`, sort key: `shop_id`)
- Create an S3 bucket for media uploads
- Create an IAM user with appropriate permissions

### DEMO_MODE Configuration

⚠️ **CRITICAL**: Always enable DEMO_MODE for demos and testing!

```env
DEMO_MODE=true
DEMO_TO_NUMBERS=+15551234567,+15559876543
SCOPE_CALLS_TO_DEMO_LIST=true
```

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  Mastra Workflow│────▶│    Vapi API     │
│   (Frontend)    │     │  (Orchestrator) │     │  (Voice Calls)  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │  OpenRouter     │              │
         │              │  (Claude LLM)   │              │
         │              └─────────────────┘              │
         │                                               │
         ▼                                               ▼
┌─────────────────┐                             ┌─────────────────┐
│   DynamoDB      │◀────────────────────────────│  Vapi Webhooks  │
│   (Sessions)    │                             │  (Call Events)  │
└─────────────────┘                             └─────────────────┘
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # Auth0 routes
│   │   ├── v1/sessions/   # Session CRUD
│   │   ├── vapi/          # Vapi webhooks
│   │   └── webhooks/      # Freepik webhooks
│   ├── session/           # Session pages
│   └── page.tsx           # Landing page
├── components/
│   ├── glass/             # Glass UI components
│   ├── layout/            # Layout components
│   ├── report/            # Report components
│   ├── session/           # Session components
│   └── ui/                # shadcn/ui components
├── hooks/                 # React hooks
└── lib/
    ├── config/            # Environment & constants
    ├── db/                # DynamoDB repositories
    ├── demo/              # DEMO_MODE enforcement
    ├── orchestrator/      # Mastra workflow
    ├── services/          # External service clients
    │   ├── vapi/          # Vapi client & validation
    │   ├── openrouter.ts  # Claude via OpenRouter
    │   ├── freepik.ts     # Image-to-prompt
    │   └── s3.ts          # S3 operations
    └── types/             # TypeScript types
```

## 🔒 HARD REQUIREMENTS

The following requirements are enforced at runtime:

1. **Voice Provider**: MUST be ElevenLabs (`"11labs"`)
2. **LLM Provider**: MUST be Anthropic (`"anthropic"`)
3. **LLM Model**: MUST be Claude Opus 4.5 (`"claude-opus-4-5-20251101"`)
4. **Thinking**: MUST be enabled with valid `budgetTokens`

Any attempt to use different providers/models will throw a `SpecViolationError`.

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 🚀 Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy!

### AWS Infrastructure

Create the following resources:

1. **DynamoDB Tables**:
   - `autoquote-sessions` (on-demand capacity)
   - `autoquote-calls` (on-demand capacity)
   - Add GSI on `user_id` for sessions table

2. **S3 Bucket**:
   - Enable CORS for presigned uploads
   - Enable server-side encryption

3. **IAM User**:
   - DynamoDB read/write permissions
   - S3 read/write permissions

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📧 Support

For support, email support@autoquote.ai or open an issue.
