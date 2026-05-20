export interface Conversation {
  id: string
  title: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export type EventType =
  | 'THINKING'
  | 'TOOL_CALL'
  | 'TOOL_RESULT'
  | 'TOOL_ERROR'
  | 'FORM_REQUEST'
  | 'FORM_RESOLVED'
  | 'TOKEN'
  | 'RESPONSE_START'
  | 'RESPONSE_END'
  | 'AGENT_START'
  | 'AGENT_END'
  | 'ERROR'
  | 'ITERATION_START'
  | 'ITERATION_END'

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
