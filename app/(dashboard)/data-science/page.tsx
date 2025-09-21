"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import {
  Brain,
  Database,
  TrendingUp,
  MapPin,
  Users,
  AlertTriangle,
  Calculator,
  FileText,
  Zap,
  Target
} from "lucide-react";
import {
  AI_STARTER_PROMPTS,
  ANALYST_SCENARIOS,
  DOCUMENTATION_LINKS,
  STUDENT_PROMPTS,
  STUDENT_DB_RECIPES,
} from "@/lib/data/insights";
const AskAI = dynamic(() => import("@/components/AskAI"), { ssr: false });

const systemPrompt = `You are the ACE Transit Intelligence Copilot. Your charter:
- Reason about Automated Camera Enforcement (ACE) bus lane violations and CUNY rider demand.
- Join ACE, ridership, speed, congestion pricing, and curb regulation context.
- When unsure, ask for queries or recommend validation steps. Always cite data sources.
- Prefer SQL for structured pulls, Python for modeling, and Mapbox/Deck.gl for spatial visuals.
- Produce executive-ready narratives with next actions and confidence levels.`;

export default function DataSciencePage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; jobId?: string }>(null);
  const [showExplain, setShowExplain] = useState(false);

  const prompts = useMemo(() => AI_STARTER_PROMPTS.slice(0, 5), []);
  const studentPrompts = useMemo(() => STUDENT_PROMPTS.slice(0, 4), []);

  async function onPredict() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/ml/predict", { method: "POST" });
      const json = await res.json();
      setResult(json);
    } catch (e) {
      setResult({ ok: false });
    } finally {
      setRunning(false);
    }
  }

  async function onSimulate() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/ml/simulate", { method: "POST" });
      const json = await res.json();
      setResult(json);
    } catch (e) {
      setResult({ ok: false });
    } finally {
      setRunning(false);
    }
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658", "#FF7C7C"];

  const mlMetrics = [
    { name: "Accuracy", value: 87, target: 90, color: "green" },
    { name: "Precision", value: 82, target: 85, color: "blue" },
    { name: "Recall", value: 91, target: 88, color: "orange" },
    { name: "F1 Score", value: 86, target: 87, color: "purple" }
  ];

  const queryComplexity = [
    { name: "Simple", count: 45, percentage: 35 },
    { name: "Medium", count: 67, percentage: 52 },
    { name: "Complex", count: 17, percentage: 13 }
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Data Science & AI</h1>
        <p className="text-sm text-foreground/70">Advanced analytics, ML predictions, and intelligent workflow orchestration.</p>
      </header>
      <section aria-labelledby="datascience-brief" className="rounded-xl border border-border/60 bg-card/70 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="datascience-brief" className="text-sm font-semibold text-foreground">Pipeline checklist</h2>
            <p className="text-xs text-muted-foreground">
              All agents connected to Neon Postgres, Socrata APIs, and real-time data streams. Ready for complex multi-step analysis.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="default" className="bg-green-100 text-green-800">ML Agent: Ready</Badge>
            <Badge variant="default" className="bg-blue-100 text-blue-800">NL Query: Ready</Badge>
            <Badge variant="default" className="bg-purple-100 text-purple-800">Workflow: Ready</Badge>
          </div>
        </div>
      </section>
      <div className="text-xs">
        <button onClick={() => setShowExplain((s) => !s)} className="rounded-md border border-foreground/10 hover:border-foreground/20 px-2 py-1 transition-colors">
          {showExplain ? "Hide explanation" : "Explain this view"}
        </button>
        {showExplain && (
          <div className="mt-2 rounded-md border border-foreground/10 p-3 text-foreground/80">
            Use these controls to call stubbed ML endpoints and view raw responses. The Ask AI panel streams a concise text summary using available tools.
          </div>
        )}
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="tools">Tools & APIs</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Brain className="h-5 w-5" />
                  ML Prediction Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Statistical forecasting and policy simulation</p>
                <div className="space-y-2">
                  <p className="text-xs font-medium">Available Tools:</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">forecast_violations</Badge>
                    <Badge variant="secondary" className="text-xs">simulate_policy_impact</Badge>
                    <Badge variant="secondary" className="text-xs">comparative_analysis</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Database className="h-5 w-5" />
                  Natural Language Query Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Parse queries and generate SQL</p>
                <div className="space-y-2">
                  <p className="text-xs font-medium">Available Tools:</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">parse_query_intent</Badge>
                    <Badge variant="secondary" className="text-xs">generate_sql_query</Badge>
                    <Badge variant="secondary" className="text-xs">validate_data_query</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Zap className="h-5 w-5" />
                  Workflow Orchestration Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Coordinate complex multi-step analysis</p>
                <div className="space-y-2">
                  <p className="text-xs font-medium">Available Tools:</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">orchestrate_campus_study</Badge>
                    <Badge variant="secondary" className="text-xs">orchestrate_policy_analysis</Badge>
                    <Badge variant="secondary" className="text-xs">orchestrate_emergency_response</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  ML Model Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mlMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" name="Current" />
                    <Bar dataKey="target" fill="#82ca9d" name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Query Complexity Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={queryComplexity}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {queryComplexity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">ML Prediction</CardTitle>
              </CardHeader>
              <CardContent>
                <button
                  onClick={onPredict}
                  disabled={running}
                  className="w-full rounded-lg border border-foreground/10 hover:border-foreground/20 p-4 text-left transition-colors"
                >
                  <div className="font-medium">Run Violation Forecast</div>
                  <div className="text-sm text-foreground/70">Statistical model with confidence intervals</div>
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Policy Simulation</CardTitle>
              </CardHeader>
              <CardContent>
                <button
                  onClick={onSimulate}
                  disabled={running}
                  className="w-full rounded-lg border border-foreground/10 hover:border-foreground/20 p-4 text-left transition-colors"
                >
                  <div className="font-medium">Run Impact Analysis</div>
                  <div className="text-sm text-foreground/70">Scenario modeling and recommendations</div>
                </button>
              </CardContent>
            </Card>
          </div>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-foreground/5 p-4 rounded-lg overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Access Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="rounded-lg border border-foreground/10 p-3">
                    <div className="font-medium">Neon Postgres Queries</div>
                    <p className="mt-1 text-xs text-foreground/60">Direct SQL access to ACE violations, route data, and campus information</p>
                  </li>
                  <li className="rounded-lg border border-foreground/10 p-3">
                    <div className="font-medium">Socrata API Integration</div>
                    <p className="mt-1 text-xs text-foreground/60">NYC Open Data portal datasets with automatic pagination</p>
                  </li>
                  <li className="rounded-lg border border-foreground/10 p-3">
                    <div className="font-medium">CUNY Campus Data</div>
                    <p className="mt-1 text-xs text-foreground/60">Geographic and enrollment data for spatial analysis</p>
                  </li>
                  <li className="rounded-lg border border-foreground/10 p-3">
                    <div className="font-medium">MCP Server Tools</div>
                    <p className="mt-1 text-xs text-foreground/60">Standardized interface for external data sources</p>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Analysis Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="rounded-lg border border-foreground/10 p-3">
                    <div className="font-medium">Statistical Forecasting</div>
                    <p className="mt-1 text-xs text-foreground/60">Linear regression, seasonal adjustment, confidence intervals</p>
                  </li>
                  <li className="rounded-lg border border-foreground/10 p-3">
                    <div className="font-medium">Policy Simulation</div>
                    <p className="mt-1 text-xs text-foreground/60">Scenario modeling for ACE expansion, pricing changes</p>
                  </li>
                  <li className="rounded-lg border border-foreground/10 p-3">
                    <div className="font-medium">Spatial Analysis</div>
                    <p className="mt-1 text-xs text-foreground/60">Geographic queries, hotspot detection, campus proximity</p>
                  </li>
                  <li className="rounded-lg border border-foreground/10 p-3">
                    <div className="font-medium">Workflow Orchestration</div>
                    <p className="mt-1 text-xs text-foreground/60">Multi-step analysis coordination and synthesis</p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Student-Focused Prompts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {studentPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setResult({ ok: true, jobId: prompt })}
                      className="w-full rounded-lg border border-foreground/10 px-3 py-2 text-left hover:border-foreground/30 transition-colors"
                      type="button"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SQL Recipes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {STUDENT_DB_RECIPES.map((recipe, idx) => (
                    <div key={idx} className="rounded-lg border border-foreground/10 p-3">
                      <div className="font-medium text-foreground/90">{recipe.title}</div>
                      <p className="mt-1 text-xs text-foreground/60">{recipe.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      {result && (
        <pre className="text-xs bg-foreground/5 p-4 rounded-lg overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      )}
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">System prompt sketch</h2>
        <pre className="text-xs leading-relaxed whitespace-pre-wrap bg-foreground/5 p-3 rounded-lg border border-foreground/10">
{systemPrompt}
        </pre>
        <p className="text-xs text-foreground/60">Pair this with tool metadata to wire the copilot into the dashboard or external teams.</p>
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">Recommended AI tools</h2>
        <ul className="space-y-2 text-sm text-foreground/80">
          <li className="rounded-lg border border-foreground/10 p-3">
            <div className="font-medium">sql.query(dataset, sql)</div>
            <p className="mt-1 text-xs text-foreground/60">Run parameterized ACE, ridership, or congestion pricing queries and stream tabular results.</p>
          </li>
          <li className="rounded-lg border border-foreground/10 p-3">
            <div className="font-medium">python.exec(code, files)</div>
            <p className="mt-1 text-xs text-foreground/60">Model violation forecasts, Monte Carlo simulations, or causal comparisons with pandas + statsmodels.</p>
          </li>
          <li className="rounded-lg border border-foreground/10 p-3">
            <div className="font-medium">viz.map(geojson, options)</div>
            <p className="mt-1 text-xs text-foreground/60">Render hotspots, route alignments, or pre/post CBD segments directly from the assistant.</p>
          </li>
          <li className="rounded-lg border border-foreground/10 p-3">
            <div className="font-medium">report.generate(sections)</div>
            <p className="mt-1 text-xs text-foreground/60">Assemble stakeholder-ready briefs with summary, metrics, visuals, and recommended actions.</p>
          </li>
        </ul>
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">Prompt library</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setResult({ ok: true, jobId: prompt })}
              className="rounded-lg border border-foreground/10 px-3 py-2 text-left hover:border-foreground/30 transition-colors"
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>
        <p className="text-xs text-foreground/60">Click a prompt to stage it. Replace this stub with direct calls into the assistant API.</p>
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">Scenario blueprints</h2>
        <ul className="space-y-3 text-sm text-foreground/80">
          {ANALYST_SCENARIOS.map((scenario) => (
            <li key={scenario.title} className="rounded-lg border border-foreground/10 p-3">
              <div className="font-medium text-foreground/90">{scenario.title}</div>
              <div className="mt-1 text-xs text-foreground/60">Expected inputs: {scenario.expectedInputs}</div>
              <p className="mt-2 leading-relaxed">{scenario.description}</p>
              <p className="mt-2 text-xs text-foreground/60">Playbook: {scenario.playbook}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
        <h2 className="text-sm font-medium">Reference material</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {DOCUMENTATION_LINKS.map((doc) => (
            <a key={doc.href} href={doc.href} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-foreground/10 px-3 py-2 hover:border-foreground/30 transition-colors">
              <div className="font-medium text-foreground/90">{doc.title}</div>
              <p className="mt-1 text-xs text-foreground/60 leading-relaxed">{doc.summary}</p>
            </a>
          ))}
        </div>
      </div>
      <AskAI />
    </div>
  );
}
