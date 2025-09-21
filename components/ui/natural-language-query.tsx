"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Brain,
  Database,
  Zap,
  Lightbulb,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { comprehensiveAgent, ComprehensiveAgentUIMessage } from "@/lib/agents/insightAgent";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

interface QueryResult {
  id: string;
  query: string;
  timestamp: Date;
  agent: string;
  complexity: string;
  confidence: number;
  results: any;
  status: "pending" | "processing" | "completed" | "error";
}

const QUERY_EXAMPLES = [
  {
    category: "Violation Analysis",
    queries: [
      "Show me violation trends for M15-SBS over the last 6 months",
      "Compare ACE vs non-ACE routes in Queens",
      "Find routes with highest exempt vehicle rates",
      "What are the top 10 violation hotspots near CUNY campuses?"
    ]
  },
  {
    category: "Campus Impact",
    queries: [
      "Analyze Hunter College commute patterns and violations",
      "Compare student impact on ACE vs non-ACE routes",
      "Show violation trends near Brooklyn College",
      "Which CUNY campuses have the most route violations?"
    ]
  },
  {
    category: "Policy Analysis",
    queries: [
      "Simulate expanding ACE to Q46 route",
      "What would be the impact of reducing exempt vehicles by 20%",
      "Compare congestion pricing effects on CBD routes",
      "Model the effect of weekend ACE enforcement"
    ]
  },
  {
    category: "Forecasting",
    queries: [
      "Forecast violations for B44-SBS over the next 3 months",
      "Predict campus route performance during fall semester",
      "What are the seasonal patterns in violation data?",
      "Generate confidence intervals for M15-SBS predictions"
    ]
  }
];

const AGENT_TYPES = [
  { id: "comprehensive", name: "Comprehensive Analysis", icon: <Sparkles className="h-4 w-4" />, description: "Multi-agent coordination" },
  { id: "ml", name: "ML Prediction", icon: <Brain className="h-4 w-4" />, description: "Statistical forecasting" },
  { id: "nl", name: "Natural Language", icon: <Database className="h-4 w-4" />, description: "Query to SQL" },
  { id: "workflow", name: "Workflow", icon: <Zap className="h-4 w-4" />, description: "Multi-step analysis" }
];

export default function NaturalLanguageQuery() {
  const [query, setQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("comprehensive");
  const [analysisDepth, setAnalysisDepth] = useState("standard");
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["Violation Analysis"]));

  const { messages, sendMessage, status } = useChat<ComprehensiveAgentUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsProcessing(true);
    const queryId = `query-${Date.now()}`;

    // Add to history
    const newQuery: QueryResult = {
      id: queryId,
      query,
      timestamp: new Date(),
      agent: selectedAgent,
      complexity: "processing",
      confidence: 0,
      results: null,
      status: "processing"
    };

    setQueryHistory(prev => [newQuery, ...prev]);

    try {
      // Send to comprehensive agent
      await sendMessage({ text: query });

      // Update query status
      setQueryHistory(prev =>
        prev.map(q =>
          q.id === queryId
            ? { ...q, status: "completed", complexity: "standard", confidence: 85 }
            : q
        )
      );
    } catch (error) {
      setQueryHistory(prev =>
        prev.map(q =>
          q.id === queryId
            ? { ...q, status: "error", complexity: "error", confidence: 0 }
            : q
        )
      );
    } finally {
      setIsProcessing(false);
      setQuery("");
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const useExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const getStatusColor = (status: QueryResult["status"]) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getAgentIcon = (agentId: string) => {
    const agent = AGENT_TYPES.find(a => a.id === agentId);
    return agent?.icon || <MessageSquare className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Natural Language Query Interface
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Ask questions in plain English and get comprehensive analysis from multiple AI agents
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Query</label>
                <Textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Show me violation trends for M15-SBS and predict the impact of expanding ACE coverage..."
                  className="min-h-[80px] resize-none"
                  disabled={isProcessing}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Analysis Agent</label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_TYPES.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          <div className="flex items-center gap-2">
                            {agent.icon}
                            <div>
                              <div className="font-medium">{agent.name}</div>
                              <div className="text-xs text-muted-foreground">{agent.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Analysis Depth</label>
                  <Select value={analysisDepth} onValueChange={setAnalysisDepth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick">Quick Analysis</SelectItem>
                      <SelectItem value="standard">Standard Analysis</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={!query.trim() || isProcessing} className="w-full">
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze Query
                  </>
                )}
              </Button>
            </form>

            {messages.length > 0 && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Latest Analysis</h4>
                <div className="text-sm text-muted-foreground max-h-40 overflow-y-auto">
                  {messages[messages.length - 1].parts.map((part, idx) => (
                    <div key={idx} className="mb-2">
                      {part.type === "text" && part.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Example Queries
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Click any example to try it out
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {QUERY_EXAMPLES.map((category) => (
                <div key={category.category}>
                  <button
                    onClick={() => toggleCategory(category.category)}
                    className="flex items-center justify-between w-full text-left p-2 rounded hover:bg-muted/50"
                  >
                    <span className="text-sm font-medium">{category.category}</span>
                    {expandedCategories.has(category.category) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {expandedCategories.has(category.category) && (
                    <div className="ml-4 space-y-2 mt-2">
                      {category.queries.map((exampleQuery, idx) => (
                        <button
                          key={idx}
                          onClick={() => useExampleQuery(exampleQuery)}
                          className="block w-full text-left p-2 text-xs rounded border hover:border-primary/50 transition-colors"
                        >
                          {exampleQuery}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Query History & Results</CardTitle>
          <p className="text-sm text-muted-foreground">
            Track your analysis history and access previous results
          </p>
        </CardHeader>
        <CardContent>
          {queryHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No queries yet. Try asking a question above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queryHistory.slice(0, 5).map((queryResult) => (
                <div key={queryResult.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getAgentIcon(queryResult.agent)}
                      <Badge className={getStatusColor(queryResult.status)}>
                        {queryResult.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {queryResult.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm mb-2">{queryResult.query}</p>

                  {queryResult.status === "completed" && (
                    <div className="text-xs text-muted-foreground">
                      Agent: {queryResult.agent} | Complexity: {queryResult.complexity} | Confidence: {queryResult.confidence}%
                    </div>
                  )}

                  {queryResult.status === "error" && (
                    <div className="text-xs text-red-600">
                      Error processing query. Please try again.
                    </div>
                  )}
                </div>
              ))}

              {queryHistory.length > 5 && (
                <div className="text-center">
                  <Button variant="outline" size="sm">
                    View All History ({queryHistory.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {AGENT_TYPES.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="text-green-600">{agent.icon}</div>
                <div>
                  <div className="text-sm font-medium">{agent.name}</div>
                  <div className="text-xs text-muted-foreground">{agent.description}</div>
                  <Badge variant="secondary" className="text-xs mt-1">Ready</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
