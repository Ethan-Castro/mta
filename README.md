
# 🚍 [NYC Transport Data - CLICK HERE](https://mta-data.com)

**Unified MTA and DOT analytics platform**

This project combines **MTA and NYC Department of Transportation data** to provide comprehensive transit insights. Built for executive decision-making, it analyzes bus lane enforcement (ACE), traffic patterns, congestion pricing impacts, and CUNY student mobility. It leverages modern web technologies, serverless databases, and AI integrations to provide real-time insights for executives, policy makers, and data scientists.

---

## 📖 Overview

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript  
- **Styling**: Tailwind CSS 4 + Radix UI + custom AI UI elements  
- **Database**: Neon Postgres (serverless) with MCP (Model Context Protocol)  
- **AI Integration**: Vercel AI SDK, OpenAI, Claude, Gemini, Grok, ElevenLabs (speech-to-text)  
- **Authentication**: Stack Auth  
- **Hosting**: Vercel (optimized for Edge Runtime)  

---

## 🏗️ Architecture

### Core Features
- **Next.js App Router** for a modern serverless web app.
- **Global dashboard shell layout** with persistent filters.
- **Serverless Neon Postgres** with schema for violations, conversations, and messages.
- **MCP Protocol** for AI-to-database interaction.
- **AI Copilot** for SQL queries, visualization, speech-to-text, and report generation.

### Data Sources
- **MTA Data**: Bus speed data, ACE violations dataset ([kh8p-hcbm](https://data.cityofnewyork.us/))
- **NYC DOT Data**: Traffic patterns, congestion metrics, infrastructure data
- **CUNY Data**: Campus metrics and locations
- **Socrata API**: Real-time updates
- **NYC Police Precinct Data**: Violation enforcement context  

---

## 📊 Site Structure

### Core Views
- **Home (`/`)**: Persona navigation, business questions, prediction cards.
- **Executive Dashboard (`/executive`)**: KPIs, trend analysis, AI-generated summaries.
- **Operations Dashboard (`/operations`)**: Route benchmarking, ACE hotspots, exempt vehicle tracking.
- **Transport Copilot (`/chat`)**: Multi-model AI chat, SQL execution, visualization, email export.  
- **Additional Views**:  
  - `/map` – Spatial analysis  
  - `/students` – CUNY student routes  
  - `/policy` – CBD & congestion pricing  
  - `/data-science` – ML predictions & simulations  
  - `/presentation` – Animated business questions  

---

## 🧩 API Structure

```

/api/
├── chat/stream/          # AI streaming endpoint
├── violations/           # Violation data endpoints
├── insights/curated/     # Pre-computed insights
├── cuny/campuses/        # Campus data
├── mcp/                  # Model Context Protocol
├── health/               # System health checks
└── email/                # Email functionality

````

---

## 🤖 AI Integration

- **Multi-model support**: GPT-5, Claude, Gemini, Grok  
- **Tool orchestration**: SQL execution, web search, visualization  
- **Streaming responses**: Real-time AI outputs with metadata  
- **Speech-to-text**: ElevenLabs integration  
- **Email export**: Send reports directly to stakeholders  

---

## 🔑 Key Features

1. **Global Filtering System**  
   - Date range, routes, campus type filters  
   - Persistent across views  

2. **Real-time Data Integration**  
   - Live Neon database queries  
   - CUNY + Socrata APIs  
   - Health monitoring  

3. **Interactive Visualizations**  
   - Sparklines, grouped bar charts, multi-line time series  
   - Mapbox-based hotspot and route maps  
   - Pie charts and custom charts  

4. **Authentication & Security**  
   - Stack Auth with JWT tokens  
   - Row-level security (RLS)  
   - Environment variable validation  

5. **Responsive Design**  
   - Mobile-first, dark/light mode  
   - Accessible via ARIA labels and keyboard navigation  

---

## 🔧 Environment Setup

### Environment Variables
```bash
# AI Gateway
AI_GATEWAY_API_KEY=

# Database
DATABASE_URL=
NEON_MCP_SSE_URL=

# External APIs
SOCRATA_APP_TOKEN=
ELEVENLABS_API_KEY=
EXA_API_KEY=

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN=

# Auth
NEXT_PUBLIC_STACK_PROJECT_ID=
STACK_SECRET_SERVER_KEY=
````

### Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run mcp:neon     # Start local MCP server
```

### Deployment

* Optimized for **Vercel** with Edge runtime.
* Supports static generation & CDN integration.

---

## 🎯 Business Context

This project addresses **MTA Datathon 2025**’s three core business questions:

1. **Student Routes**

   * How do ACE vs non-ACE corridors serving CUNY campuses compare?
   * Analysis of bus speed changes over time.

2. **Exempt Vehicles**

   * Which fleets repeatedly violate rules despite exemptions?
   * Mapping hotspot violations across CUNY routes.

3. **CBD Performance**

   * How have violations and speeds changed under congestion pricing?
   * Mapping performance pre- and post-policy.

📌 **Mission**: Integrate MTA and DOT data to improve transit reliability, reduce congestion, and optimize bus speeds (average +5%, up to +30% in some corridors).

---

## 📅 Datathon Details

* **Event**: MTA Datathon 2025 – *Bring Data Science to Life with MTA & MHC*
* **Primary Dataset**: Bus Automated Camera Enforcement (ACE) Violations
* **Kickoff**: Sep 19, 2025 | 2:00–4:00 PM EST
* **Zoom Link**: [Join Meeting](https://us02web.zoom.us/j/85368484656?pwd=mQcZTZPJAA5kj5jbk4Zvd8pWqJxPn4.1)
* **Passcode**: `442832`

---

## 📊 Evaluation Rubric

* Thorough understanding of datasets & integration of relevant sources
* Clear, data-supported insights addressing business questions
* Effective visuals and well-organized GitHub project
* Recommendations tied directly to findings and MTA’s context

---

## 📎 Additional Resources

* [MTA Bus Route Segment Speeds: 2023–2024](https://data.ny.gov/)
* [MTA Bus Route Segment Speeds: 2025](https://data.ny.gov/)
* [NYPD Precinct Data](https://www.nyc.gov/assets/nypd)

---

## 🏆 Team Vision

This project delivers **real-time, AI-powered analytics** by unifying MTA and NYC DOT data to improve bus speeds, reduce congestion, and optimize transportation infrastructure. It is designed to be **scalable, production-ready, and executive-friendly** for decision-making.

---

## 🔗 Related API Repositories

This project builds on dedicated API services developed for the datathon.
The following repositories contain the training, preprocessing, and API logic that power the insights in **NYC Transport Data**:

- [**mta-ace-api**](https://github.com/Ethan-Castro/mta-ace-api)  
  Backend service focused on Automated Camera Enforcement (ACE) violation data, including preprocessing, route-level aggregations, and enforcement metrics.

- [**mta-analytics-api**](https://github.com/Ethan-Castro/mta-analytics-api)  
  Analytics service providing curated insights, student route analysis, and congestion pricing comparisons. Designed to integrate directly with the Insight Studio dashboard for real-time analysis.

---

# Express-Name
