import { useEffect, useState } from 'react'
import { chatApi } from '../services/api'

const HUD_CONV_KEY = 'jarvis_hud_conversation_id'

/**
 * Manages a dedicated conversation for the HUD terminal.
 * Creates one on first use, persists the ID in localStorage.
 */
export function useHudConversation() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem(HUD_CONV_KEY)
      if (stored) {
        setConversationId(stored)
        setLoading(false)
        return
      }
      try {
        const conv = await chatApi.createConversation('J.A.R.V.I.S. HUD Terminal')
        localStorage.setItem(HUD_CONV_KEY, conv.id)
        setConversationId(conv.id)
      } catch (e) {
        console.error('Failed to create HUD conversation', e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const resetConversation = async () => {
    localStorage.removeItem(HUD_CONV_KEY)
    setLoading(true)
    try {
      const conv = await chatApi.createConversation('J.A.R.V.I.S. HUD Terminal')
      localStorage.setItem(HUD_CONV_KEY, conv.id)
      setConversationId(conv.id)
    } finally {
      setLoading(false)
    }
  }

  return { conversationId, loading, resetConversation }
}
