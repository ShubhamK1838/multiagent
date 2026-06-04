export interface Conversation {
  id: string
  title: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'thinking'
  content: string
  createdAt?: string
}

export type EventType =
  | 'THINKING'
  | 'TOOL_CALL'
  | 'TOOL_RESULT'
  | 'TOOL_ERROR'
  | 'FORM_REQUEST'
  | 'FORM_RESOLVED'
  | 'FORM_SUBMITTED'
  | 'TOKEN'
  | 'STREAM_RESET'
  | 'RESPONSE_START'
  | 'RESPONSE_END'
  | 'AGENT_START'
  | 'AGENT_END'
  | 'ERROR'
  | 'ITERATION_START'
  | 'ITERATION_END'
  | 'PROACTIVE_ALERT'
  | 'COORDINATION_PLAN'
  | 'AGENT_SPAWNED'
  | 'AGENT_STATUS'
  | 'AGENT_MESSAGE'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'

export interface AgentEvent {
  id: string
  type: EventType
  conversationId: string
  content: string
  metadata?: Record<string, unknown>
  timestamp: string
}

// ── Multi-agent ("swarm") ───────────────────────────────────────────────────

export type SwarmAgentStatus = 'idle' | 'thinking' | 'working' | 'waiting' | 'done' | 'failed'
export type SwarmTaskStatus = 'pending' | 'running' | 'done' | 'failed' | 'retrying' | 'skipped'

export interface SwarmAgent {
  id: string          // role key, stable per run
  role: string
  displayName: string
  model: string
  color?: string
  status: SwarmAgentStatus
}

export interface SwarmMessage {
  id: string
  from: string
  to?: string         // undefined = broadcast
  type: string        // PROPOSAL | RESULT | CRITIQUE | HANDOFF | ...
  content: string
}

export interface SwarmTask {
  id: string
  role: string
  goal: string
  dependsOn: string[]
  status: SwarmTaskStatus
  attempt: number
  resultSnippet?: string
}

export interface SwarmState {
  active: boolean
  planSummary: string | null
  agents: Record<string, SwarmAgent>
  tasks: Record<string, SwarmTask>
  messages: SwarmMessage[]
}

/** A configurable multi-agent role (matches the backend AgentDefinition entity). */
export interface AgentDefinition {
  id: string
  roleKey: string
  displayName: string
  systemPrompt: string
  modelId: string | null
  allowedTools: string[] | null
  maxIterations: number
  color: string | null
  sortOrder: number
  enabled: boolean
}

export interface AgentDefinitionInput {
  roleKey?: string
  displayName?: string
  systemPrompt?: string
  modelId?: string | null
  allowedTools?: string[] | null
  maxIterations?: number
  color?: string | null
  sortOrder?: number
  enabled?: boolean
}

export interface ToolDefinition {
  id: string
  name: string
  description: string
  parametersSchema: Record<string, unknown>
  toolType: 'BUILTIN' | 'HTTP' | 'SCRIPT'
  handlerConfig: Record<string, unknown>
  enabled: boolean
  requiresConfirmation: boolean
  createdAt: string
}

export interface SystemSetting {
  id: string
  settingKey: string
  settingValue: string
  settingType: string
  category: string
  description: string
  isSecret: boolean
}

export interface FormRequest {
  id: string
  conversationId: string
  schema: Record<string, unknown>
  status: 'PENDING' | 'RESOLVED'
  response?: Record<string, unknown>
  createdAt: string
}

export type AiModelProvider = 'OPENAI' | 'OLLAMA' | 'BEDROCK'

export interface AiModel {
  id: string
  name: string
  provider: AiModelProvider
  modelId: string
  baseUrl: string | null
  hasApiKey: boolean
  awsRegion: string | null
  temperature: number
  maxTokens: number
  default: boolean
  enabled: boolean
  options: Record<string, unknown>
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface AiModelInput {
  name: string
  provider: AiModelProvider
  modelId: string
  baseUrl?: string | null
  apiKey?: string | null
  awsRegion?: string | null
  temperature: number
  maxTokens: number
  isEnabled?: boolean
  options?: Record<string, unknown>
  description?: string | null
}

export interface WorkflowStep {
  id: string
  workflowId: string
  stepOrder: number
  toolName: string
  toolArgs: Record<string, unknown>
}

export interface Workflow {
  id: string
  name: string
  description: string | null
  runCount: number
  lastRunAt: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkflowWithSteps {
  workflow: Workflow
  steps: WorkflowStep[]
}

export interface ConversationSummary {
  id: string
  conversationId: string
  summary: string
  keyPaths: string[]
  keyFacts: Record<string, unknown>
  modelUsed: string | null
  tokenCount: number | null
  createdAt: string
}

// ── Visualization panel data types ───────────────────────────────────────────

export interface TableData {
  title: string
  columns: string[]
  rows: unknown[][]
}

export interface ChartDataset {
  label: string
  data: number[]
  color?: string
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'area'
  title: string
  labels: string[]
  datasets: ChartDataset[]
}

export interface CodeData {
  title: string
  language: string
  code: string
}

export interface JsonData {
  title: string
  data: unknown
}

export interface DiffData {
  title: string
  before: string
  after: string
  language?: string
}

export interface MetricItem {
  label: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'flat'
}

export interface MetricsData {
  title: string
  metrics: MetricItem[]
}

// ── 3D visualization data types ───────────────────────────────────────────────

export interface NetworkNode { id: string; label: string; color?: string }
export interface NetworkEdge { source: string; target: string; color?: string }
export interface NetworkData { title: string; nodes: NetworkNode[]; edges: NetworkEdge[] }

export interface GlobePoint { lat: number; lon: number; label: string; value?: number }
export interface GlobeData  { title: string; points: GlobePoint[] }

export interface ScatterPoint { x: number; y: number; z: number; label?: string; series?: string }
export interface ScatterData  {
  title: string
  xLabel: string; yLabel: string; zLabel: string
  points: ScatterPoint[]
}

// ── Additional visualization data types ──────────────────────────────────────

export interface GaugeItem {
  label: string
  value: number
  min?: number
  max?: number
  unit?: string
  color?: string
}
export interface GaugeData {
  title: string
  gauges: GaugeItem[]
}

export interface RadarSeries { label: string; values: number[]; color?: string }
export interface RadarData {
  title: string
  axes: string[]            // axis labels
  series: RadarSeries[]     // each series.values length must match axes.length
  max?: number              // optional scale maximum (defaults to data max)
}

export type Model3DShape =
  | 'cube' | 'sphere' | 'torus' | 'cone'
  | 'cylinder' | 'dodecahedron' | 'icosahedron' | 'torusknot'
export interface Model3DData {
  title: string
  shape: Model3DShape
  label?: string
  color?: string
  wireframe?: boolean
  spin?: number             // rotation speed multiplier (default 1)
}

export interface TimelineEvent {
  time: string              // label, e.g. a date or step number
  title: string
  description?: string
  status?: 'done' | 'active' | 'pending'
}
export interface TimelineData {
  title: string
  events: TimelineEvent[]
}

export interface AnswerSection { heading?: string; body: string }
export interface AnswerHighlight { label: string; value: string }
export interface AnswerCardData {
  title: string
  summary: string
  sections?: AnswerSection[]
  highlights?: AnswerHighlight[]   // small stat callouts
  tags?: string[]
}

export interface ToolExecution {
  id: string
  toolName: string
  toolType: string
  toolId?: string
  conversationId?: string
  inputArgs: Record<string, unknown>
  resultText?: string
  errorMessage?: string
  success: boolean
  durationMs?: number
  executedAt: string
}

// ── Conversation search ───────────────────────────────────────────────────────

export interface SearchResult {
  messageId: string
  conversationId: string
  conversationTitle: string
  role: string
  snippet: string
  matchType: 'keyword' | 'semantic'
  createdAt: string
}

// ── Token & cost usage ────────────────────────────────────────────────────────

export interface UsageTotals {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  totalCost: number
  calls: number
}

export interface ModelUsage {
  modelName: string
  provider: string
  totalTokens: number
  totalCost: number
  calls: number
}

export interface DailyUsage {
  day: string
  totalTokens: number
  totalCost: number
}

export interface ConversationUsage {
  conversationId: string | null
  title: string
  totalTokens: number
  totalCost: number
  calls: number
}

export interface UsageSummary {
  totals: UsageTotals
  byModel: ModelUsage[]
  daily: DailyUsage[]
}
