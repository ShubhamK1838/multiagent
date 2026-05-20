import { useEffect, useRef } from 'react'
import { useChatStore } from '../store/chatStore'
import { formApi } from '../services/api'
import type { AgentEvent } from '../types'

export function useSSE(conversationId: string | null) {
  const esRef = useRef<EventSource | null>(null)
  const store = useChatStore()

  useEffect(() => {
    if (!conversationId) return
    store.clearEvents(conversationId)

    const es = new EventSource(`/api/v1/chat/conversations/${conversationId}/events`)
    esRef.current = es

    const handleEvent = (type: string) => (e: MessageEvent) => {
      const event: AgentEvent = JSON.parse(e.data)
      store.addEvent(event)

      switch (type) {
        case 'TOKEN':
          store.appendToken(conversationId, event.content)
          break
        case 'AGENT_END':
        case 'RESPONSE_END':
          store.finalizeStream(conversationId)
          store.setThinking(conversationId, false)
          break
        case 'AGENT_START':
        case 'THINKING':
          store.setThinking(conversationId, true)
          break
        case 'FORM_REQUEST': {
          const formId = event.metadata?.formId as string
          if (formId) {
            formApi.get(formId).then(form => store.setPendingForm(form))
          }
          break
        }
        case 'FORM_RESOLVED':
          store.setPendingForm(null)
          break
        default:
          break
      }
    }

    const eventTypes = [
      'THINKING', 'TOOL_CALL', 'TOOL_RESULT', 'TOOL_ERROR',
      'FORM_REQUEST', 'FORM_RESOLVED', 'TOKEN', 'RESPONSE_START',
      'RESPONSE_END', 'AGENT_START', 'AGENT_END', 'ERROR',
      'ITERATION_START', 'ITERATION_END'
    ]

    eventTypes.forEach(type => {
      es.addEventListener(type, handleEvent(type))
    })

    return () => {
      es.close()
      esRef.current = null
    }
  }, [conversationId])
}
