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

CONGESTION_PRICING_START=2024-06-30
# NEXT_PUBLIC_BASE_URL=

# Neon MCP Server (optional - enables Postgres database tools in chat)
# Set either SSE or HTTP URL to enable Neon MCP integration
NEON_MCP_SSE_URL=https://mcp.neon.tech/sse
# NEON_MCP_HTTP_URL=https://mcp.neon.tech  # Alternative HTTP transport
```

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

### Setup

1. Configure your Neon MCP server URL in `.env.local`:
   ```bash
   NEON_MCP_SSE_URL=https://mcp.neon.tech/sse
   # or
   NEON_MCP_HTTP_URL=https://mcp.neon.tech
   ```

2. Test the integration by asking the chatbot:
   - "List my Neon projects"
   - "Create a database named 'test-db'"
   - "Run SQL: SELECT COUNT(*) FROM violations"

### Security

The Neon MCP Server is intended for local development and IDE integrations only. Always review and authorize actions requested by the LLM before execution.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
