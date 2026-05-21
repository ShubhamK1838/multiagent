import { create } from 'zustand'
import type { Conversation, AgentEvent, FormRequest } from '../types'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface ChatStore {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Record<string, ChatMessage[]>
  events: Record<string, AgentEvent[]>
  streamingContent: Record<string, string>
  pendingForm: FormRequest | null
  isThinking: Record<string, boolean>

  setConversations: (convs: Conversation[]) => void
  setActiveConversation: (id: string) => void
  addConversation: (conv: Conversation) => void
  addMessage: (conversationId: string, message: ChatMessage) => void
  appendToken: (conversationId: string, token: string) => void
  resetStream: (conversationId: string) => void
  finalizeStream: (conversationId: string) => void
  addEvent: (event: AgentEvent) => void
  setPendingForm: (form: FormRequest | null) => void
  setThinking: (conversationId: string, thinking: boolean) => void
  clearEvents: (conversationId: string) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  events: {},
  streamingContent: {},
  pendingForm: null,
  isThinking: {},

  setConversations: (convs) => set({ conversations: convs }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  addConversation: (conv) =>
    set((s) => ({ conversations: [conv, ...s.conversations] })),

  addMessage: (conversationId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: [...(s.messages[conversationId] ?? []), message],
      },
    })),

  appendToken: (conversationId, token) =>
    set((s) => ({
      streamingContent: {
        ...s.streamingContent,
        [conversationId]: (s.streamingContent[conversationId] ?? '') + token,
      },
    })),

  resetStream: (conversationId) =>
    set((s) => ({
      streamingContent: { ...s.streamingContent, [conversationId]: '' },
    })),

  finalizeStream: (conversationId) => {
    const content = get().streamingContent[conversationId] ?? ''
    if (!content) return
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: [
          ...(s.messages[conversationId] ?? []),
          { id: Date.now().toString(), role: 'assistant', content },
        ],
      },
      streamingContent: { ...s.streamingContent, [conversationId]: '' },
    }))
  },

  addEvent: (event) =>
    set((s) => ({
      events: {
        ...s.events,
        [event.conversationId]: [
          ...(s.events[event.conversationId] ?? []).slice(-99),
          event,
        ],
      },
    })),

  setPendingForm: (form) => set({ pendingForm: form }),
  setThinking: (conversationId, thinking) =>
    set((s) => ({ isThinking: { ...s.isThinking, [conversationId]: thinking } })),
  clearEvents: (conversationId) =>
    set((s) => ({ events: { ...s.events, [conversationId]: [] } })),
}))
