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

export interface AgentEvent {
  id: string
  type: EventType
  conversationId: string
  content: string
  metadata?: Record<string, unknown>
  timestamp: string
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

export type AiModelProvider = 'OPENAI' | 'OLLAMA'

export interface AiModel {
  id: string
  name: string
  provider: AiModelProvider
  modelId: string
  baseUrl: string | null
  hasApiKey: boolean
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
  rows: (string | number | boolean | null)[][]
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
