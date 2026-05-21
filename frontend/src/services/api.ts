import axios from 'axios'
import type { Conversation, ToolDefinition, SystemSetting, FormRequest, AiModel, AiModelInput } from '../types'

const api = axios.create({ baseURL: '/api/v1' })

export const chatApi = {
  createConversation: (title?: string) =>
    api.post<Conversation>('/chat/conversations', { title }).then(r => r.data),

  listConversations: () =>
    api.get<Conversation[]>('/chat/conversations').then(r => r.data),

  getMessages: (conversationId: string) =>
    api.get(`/chat/conversations/${conversationId}/messages`).then(r => r.data),

  sendMessage: (conversationId: string, message: string) =>
    api.post(`/chat/conversations/${conversationId}/messages`, { message }).then(r => r.data),

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
