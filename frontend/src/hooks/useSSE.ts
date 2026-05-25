import { useEffect, useRef } from 'react'
import { useChatStore } from '../store/chatStore'
import { formApi } from '../services/api'
import type { AgentEvent } from '../types'

export function useSSE(conversationId: string | null, onEvent?: (event: AgentEvent) => void) {
  const esRef = useRef<EventSource | null>(null)
  const store = useChatStore()
  
  const onEventRef = useRef(onEvent)
  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (!conversationId) return
    store.clearEvents(conversationId)

    const es = new EventSource(`/api/v1/chat/conversations/${conversationId}/events`)
    esRef.current = es

    const handleEvent = (type: string) => (e: MessageEvent) => {
      const event: AgentEvent = JSON.parse(e.data)
      store.addEvent(event)
      
      if (onEventRef.current) {
        onEventRef.current(event)
      }

      switch (type) {
        case 'TOKEN':
          store.appendToken(conversationId, event.content)
          break
        case 'STREAM_RESET':
          store.resetStream(conversationId)
          break
        case 'AGENT_END':
        case 'RESPONSE_END':
          store.clearThinkingMessages(conversationId)
          if (type === 'AGENT_END' && event.content && !store.streamingContent[conversationId]) {
            store.addMessage(conversationId, {
              id: Date.now().toString() + Math.random(),
              role: 'assistant',
              content: event.content,
            })
          } else {
            store.finalizeStream(conversationId)
          }
          store.setThinking(conversationId, false)
          break
        case 'AGENT_START':
          store.setThinking(conversationId, true)
          store.clearThinkingMessages(conversationId)
          break
        case 'THINKING':
          store.setThinking(conversationId, true)
          // Replace (not accumulate) — clear old thinking messages then add one
          store.clearThinkingMessages(conversationId)
          if (event.content && event.content.trim()) {
            store.addMessage(conversationId, {
              id: 'thinking-current',
              role: 'thinking',
              content: event.content,
            })
          }
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
      'FORM_REQUEST', 'FORM_RESOLVED', 'TOKEN', 'STREAM_RESET',
      'RESPONSE_START', 'RESPONSE_END', 'AGENT_START', 'AGENT_END', 'ERROR',
      'ITERATION_START', 'ITERATION_END'
    ]

    eventTypes.forEach(type => {
      es.addEventListener(type, handleEvent(type))
    })

    return () => {
      es.close()
      esRef.current = null
    }
  }, [conversationId]) // Removed onEvent from dependency array to prevent connection loops
}
