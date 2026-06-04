import axios from 'axios'
import type { Conversation, ToolDefinition, SystemSetting, FormRequest, AiModel, AiModelInput, ToolExecution, ConversationSummary, WorkflowWithSteps, Workflow, AgentDefinition, AgentDefinitionInput } from '../types'

const api = axios.create({ baseURL: '/api/v1' })

export const chatApi = {
  createConversation: (title?: string) =>
    api.post<Conversation>('/chat/conversations', { title }).then(r => r.data),

  listConversations: () =>
    api.get<Conversation[]>('/chat/conversations').then(r => r.data),

  getMessages: (conversationId: string) =>
    api.get(`/chat/conversations/${conversationId}/messages`).then(r => r.data),

  sendMessage: (conversationId: string, message: string, imageBase64?: string) =>
    api.post(`/chat/conversations/${conversationId}/messages`, { message, image: imageBase64 }).then(r => r.data),

  cancelExecution: (conversationId: string) =>
    api.post(`/chat/conversations/${conversationId}/cancel`).then(r => r.data),

  deleteConversation: (conversationId: string) =>
    api.delete(`/chat/conversations/${conversationId}`).then(r => r.data),
}

export const toolApi = {
  list: () => api.get<ToolDefinition[]>('/tools').then(r => r.data),
  create: (tool: Partial<ToolDefinition>) =>
    api.post<ToolDefinition>('/tools', tool).then(r => r.data),
  update: (id: string, tool: Partial<ToolDefinition>) =>
    api.put<ToolDefinition>(`/tools/${id}`, tool).then(r => r.data),
  toggle: (id: string) =>
    api.patch<ToolDefinition>(`/tools/${id}/toggle`).then(r => r.data),
  delete: (id: string) => api.delete(`/tools/${id}`),
  listExecutions: (limit = 50) =>
    api.get<ToolExecution[]>('/tools/executions', { params: { limit } }).then(r => r.data),
  getToolExecutions: (toolName: string, limit = 20) =>
    api.get<ToolExecution[]>(`/tools/${toolName}/executions`, { params: { limit } }).then(r => r.data),
}

export const settingsApi = {
  getAll: () => api.get<SystemSetting[]>('/settings').then(r => r.data),
  getByCategory: (category: string) =>
    api.get<SystemSetting[]>(`/settings/category/${category}`).then(r => r.data),
  update: (key: string, value: string) =>
    api.put(`/settings/${key}`, { value }).then(r => r.data),
  bulkUpdate: (settings: Record<string, string>) =>
    api.put('/settings/bulk', settings).then(r => r.data),
  generateTheme: (prompt: string) =>
    api.post('/settings/generate-theme', { prompt }).then(r => r.data),
}

export const ragApi = {
  ingest: (title: string, content: string, source?: string) =>
    api.post('/rag/ingest', { title, content, source }).then(r => r.data),
  upload: (file: File, title?: string, source?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (title) formData.append('title', title)
    if (source) formData.append('source', source)
    return api.post('/rag/upload', formData).then(r => r.data)
  },
  search: (query: string) =>
    api.get('/rag/search', { params: { query } }).then(r => r.data),
}

export const formApi = {
  get: (formId: string) =>
    api.get<FormRequest>(`/forms/${formId}`).then(r => r.data),
  submit: (formId: string, data: Record<string, unknown>) =>
    api.post(`/forms/${formId}/submit`, data).then(r => r.data),
}

export const aiModelApi = {
  list: () => api.get<AiModel[]>('/ai-models').then(r => r.data),
  listEnabled: () => api.get<AiModel[]>('/ai-models/enabled').then(r => r.data),
  getDefault: () => api.get<AiModel>('/ai-models/default').then(r => r.data),
  get: (id: string) => api.get<AiModel>(`/ai-models/${id}`).then(r => r.data),
  create: (input: AiModelInput) => api.post<AiModel>('/ai-models', input).then(r => r.data),
  update: (id: string, input: Partial<AiModelInput>) =>
    api.put<AiModel>(`/ai-models/${id}`, input).then(r => r.data),
  delete: (id: string) => api.delete(`/ai-models/${id}`),
  setDefault: (id: string) => api.post<AiModel>(`/ai-models/${id}/default`).then(r => r.data),
}

export const agentDefinitionApi = {
  list: () => api.get<AgentDefinition[]>('/agent-definitions').then(r => r.data),
  get: (id: string) => api.get<AgentDefinition>(`/agent-definitions/${id}`).then(r => r.data),
  create: (input: AgentDefinitionInput) =>
    api.post<AgentDefinition>('/agent-definitions', input).then(r => r.data),
  update: (id: string, input: AgentDefinitionInput) =>
    api.put<AgentDefinition>(`/agent-definitions/${id}`, input).then(r => r.data),
  delete: (id: string) => api.delete(`/agent-definitions/${id}`),
}

export const proactiveModeApi = {
  getStatus: () =>
    api.get<{ enabled: boolean; watchPath: string }>('/proactive/status').then(r => r.data),
  toggle: () =>
    api.post<{ enabled: boolean }>('/proactive/toggle').then(r => r.data),
  setWatchPath: (path: string) =>
    api.put<{ watchPath: string }>('/proactive/watch-path', { path }).then(r => r.data),
}

export const voiceApi = {
  // Send recorded audio to the backend, which forwards it to the NVIDIA Whisper NIM.
  transcribe: (audio: Blob) => {
    const form = new FormData()
    form.append('file', audio, 'audio.wav')
    return api
      .post<{ text?: string; error?: string }>('/voice/transcribe', form)
      .then(r => r.data.text ?? '')
  },

  // Synthesise speech via the neural TTS NIM. Resolves to an audio Blob, or rejects if the NIM
  // is disabled/unreachable so the caller can fall back to browser speech synthesis.
  speak: (text: string, voice?: string) =>
    api
      .post('/voice/speak', { text, voice }, { responseType: 'blob' })
      .then(r => r.data as Blob),
}

export const workflowApi = {
  list: () =>
    api.get<WorkflowWithSteps[]>('/workflows').then(r => r.data),
  get: (name: string) =>
    api.get<WorkflowWithSteps>(`/workflows/${name}`).then(r => r.data),
  create: (body: { name: string; description?: string; steps: { tool_name: string; tool_args: Record<string, unknown> }[] }) =>
    api.post<Workflow>('/workflows', body).then(r => r.data),
  delete: (name: string) =>
    api.delete<{ deleted: string }>(`/workflows/${name}`).then(r => r.data),
  run: (name: string, conversationId?: string) =>
    api.post<{ result: string }>(`/workflows/${name}/run`, { conversationId }).then(r => r.data),
}

export const memoryApi = {
  listSummaries: () =>
    api.get<ConversationSummary[]>('/memory/summaries').then(r => r.data),
  getSummary: (conversationId: string) =>
    api.get<ConversationSummary>(`/memory/summaries/${conversationId}`).then(r => r.data),
  clearAll: () =>
    api.delete<{ deleted: number }>('/memory/summaries').then(r => r.data),
}
