import { useState } from 'react'
import { useChatStore } from '../store/chatStore'
import { chatApi } from '../services/api'

export function useChat(conversationId: string | null) {
  const [sending, setSending] = useState(false)
  const { messages, streamingContent, isThinking, addMessage } = useChatStore()

  const convMessages = conversationId ? (messages[conversationId] ?? []) : []
  const streamContent = conversationId ? (streamingContent[conversationId] ?? '') : ''
  const thinking = conversationId ? (isThinking[conversationId] ?? false) : false

  const sendMessage = async (text: string) => {
    if (!text.trim() || !conversationId || sending) return
    setSending(true)
    addMessage(conversationId, { id: Date.now().toString(), role: 'user', content: text })
    try {
      await chatApi.sendMessage(conversationId, text)
    } finally {
      setSending(false)
    }
  }

  return { convMessages, streamContent, thinking, sending, sendMessage }
}
