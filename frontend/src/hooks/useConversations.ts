import { useEffect } from 'react'
import { useChatStore } from '../store/chatStore'
import { chatApi } from '../services/api'

export function useConversations() {
  const { conversations, activeConversationId, setConversations, setActiveConversation, addConversation } =
    useChatStore()

  useEffect(() => {
    chatApi.listConversations().then(setConversations).catch(console.error)
  }, [])

  const createConversation = async (title?: string) => {
    const conv = await chatApi.createConversation(title)
    addConversation(conv)
    setActiveConversation(conv.id)
    return conv
  }

  return { conversations, activeConversationId, setActiveConversation, createConversation }
}
