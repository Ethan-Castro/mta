This project is a Next.js dashboard for the MTA ACE Datathon with stakeholder views and ML integration stubs.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) and navigate to stakeholder views: `Executive`, `Operations`, `Policy`, and `Data Science`.

### Environment variables

Create a `.env.local` with the following keys:

```
# Vercel AI Gateway (server-only). Required for live model access.
AI_GATEWAY_API_KEY=

# OpenAI (server-only)
OPENAI_API_KEY=

# Mapbox (client-exposed)
NEXT_PUBLIC_MAPBOX_TOKEN=

# Socrata / data.ny.gov
SOCRATA_APP_TOKEN=
NY_API_KEY_ID=
NY_API_KEY_SECRET=
# Optional override (defaults to https://data.ny.gov)
# NY_DATA_BASE_URL=https://data.ny.gov

# REQUIRED: ACE violations dataset ID from data.ny.gov
NY_ACE_DATASET_ID=kh8p-hcbm

# Optional ML integration
ML_PROVIDER_TOKEN=
ML_PREDICT_URL=
ML_SIMULATE_URL=

# ElevenLabs Speech-to-Text (server-only)
ELEVENLABS_API_KEY=

CONGESTION_PRICING_START=2024-06-30
# NEXT_PUBLIC_BASE_URL=

# Neon MCP Server (optional - enables Postgres database tools in chat)
# Set either SSE or HTTP URL to enable Neon MCP integration
NEON_MCP_SSE_URL=https://mcp.neon.tech/sse
# Alternative Streamable HTTP transport (recommended endpoint suffix /mcp)
# NEON_MCP_HTTP_URL=https://mcp.neon.tech/mcp
```

Notes:
- Set `AI_GATEWAY_API_KEY` to enable live model responses. If unset or when using the UI model “Offline fallback”, the app will return a concise, non-streaming summary based on the violations API.
- Never commit secrets. Only expose client-visible keys with the `NEXT_PUBLIC_` prefix.

Only define secrets on the server; never expose them to the client. Client-visible keys must be prefixed with `NEXT_PUBLIC_`.

## Stakeholder views

- Executive: high-level KPIs and narrative area
- Operations: route comparator and map placeholders
- Policy: CBD map and pre/post trends placeholders
- Data Science: buttons to trigger prediction and simulation API stubs

## Neon MCP Integration

This project includes integration with the Neon MCP Server, allowing the chatbot to interact with your Neon Postgres databases using natural language commands.

### Features

- **Natural language database queries**: Ask questions like "List all my Neon projects" or "Create a new database"
- **SQL execution**: The chatbot can run SQL queries against your Neon databases
- **Database management**: Create, delete, and manage branches, databases, and projects
- **Migration support**: Handle database schema changes through natural language requests
- **Audio transcription**: Record voice messages or upload audio files for speech-to-text conversion using ElevenLabs

### Setup

1. Configure your Neon MCP server URL in `.env.local`:
   ```bash
   NEON_MCP_SSE_URL=https://mcp.neon.tech/sse
   # or
   NEON_MCP_HTTP_URL=https://mcp.neon.tech/mcp
   ```

2. For Cursor MCP client setup, add `.cursor/mcp.json` (already included):
   ```json
   {
     "mcpServers": {
       "Neon": {
         "command": "npx",
         "args": ["-y", "mcp-remote", "https://mcp.neon.tech/mcp"]
       }
     }
   }
   ```

   On first use Cursor will open a browser window to authorize access.

3. To run a local server instead of the hosted one, use:
   ```bash
   # Requires NEON_API_KEY in your environment
   npm run mcp:neon
   ```
   Then point your MCP client to the local process per your client's instructions.

4. Test the integration by asking the chatbot:
   - "List my Neon projects"
   - "Create a database named 'test-db'"
   - "Run SQL: SELECT COUNT(*) FROM violations"

## Audio Transcription with ElevenLabs

The AI chat interface now supports audio input through ElevenLabs speech-to-text integration. Users can record voice messages or upload audio files for transcription.

### Features

- **Voice recording**: Click the microphone button to record audio directly in the chat
- **File upload**: Upload audio files (MP3, WAV, etc.) for transcription
- **Advanced options**: Configure language detection, speaker identification, and audio event tagging
- **Real-time feedback**: Visual indicators show recording status and processing

### Setup

1. Add your ElevenLabs API key to `.env.local`:
   ```bash
   ELEVENLABS_API_KEY=your_api_key_here
   ```

2. The transcription tool supports various options:
   - **Language detection**: Automatically detect or specify language (ISO-639-1 codes)
   - **Speaker identification**: Identify different speakers in multi-person conversations
   - **Audio events**: Tag events like laughter, footsteps, etc.
   - **Timestamps**: Get word-level or character-level timestamps

### Usage

- **Recording**: Click the microphone icon to start/stop recording
- **File upload**: Click the upload icon to select an audio file
- **Transcription**: The AI will automatically transcribe the audio and respond to your spoken question

### Security

The Neon MCP Server is intended for local development and IDE integrations only. Always review and authorize actions requested by the LLM before execution.

## Neon Data API & Auth setup

1) Create `.env.local` based on the following template (or copy `.env.example` if present):

```env
# Neon Auth (Stack) – replace with your keys
NEXT_PUBLIC_STACK_PROJECT_ID=
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=
STACK_SECRET_SERVER_KEY=

# Neon DB connection(s)
DATABASE_URL=
DATABASE_URL_UNPOOLED=
PGHOST=
PGHOST_UNPOOLED=
PGUSER=
PGDATABASE=
PGPASSWORD=

# Neon Data API endpoint (PostgREST)
# Example: https://<endpoint>/<db>/rest/v1
NEON_DATA_API_URL=

# Data API requires auth (JWT bearer). If using Neon Auth on the client, pass Authorization header.
# For server probes or service usage you can set a server token/key here:
NEON_DATA_API_TOKEN=
NEON_DATA_API_KEY=

# Optional: Stack project id for headers
STACK_PROJECT_ID=
```

2) Enable the Data API for your Neon branch in the Neon Console. Ensure RLS policies are in place for all tables and your `authenticated` role has the correct GRANTs.

3) Health check the integration locally:

```bash
curl -i http://localhost:3000/api/health \
  -H "Authorization: Bearer <your_jwt_or_service_token>"
```

This calls the Data API using PostgREST-compatible params and verifies DB and MCP connections.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
