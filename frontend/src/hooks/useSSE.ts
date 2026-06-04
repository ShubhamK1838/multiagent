import { useEffect, useRef } from 'react'
import { useChatStore } from '../store/chatStore'
import { formApi } from '../services/api'
import type { AgentEvent } from '../types'

export function useSSE(conversationId: string | null, onEvent?: (event: AgentEvent) => void) {
  const esRef = useRef<EventSource | null>(null)
  const store = useChatStore()

  // Tracks whether RESPONSE_END already finalized the stream for the current turn.
  // Defined outside the effect so it persists across re-renders and is always
  // read by reference (never stale) inside the event handler closure.
  const streamFinalizedRef = useRef(new Set<string>())

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

        case 'AGENT_START':
          store.setThinking(conversationId, true)
          store.clearThinkingMessages(conversationId)
          // Reset per-turn flag so AGENT_END knows nothing is finalized yet
          streamFinalizedRef.current.delete(conversationId)
          break

        case 'RESPONSE_END': {
          // Check before finalizing — empty stream means this was a tool-call iteration (JSON buffered)
          const hadTokens = !!(useChatStore.getState().streamingContent[conversationId])
          store.clearThinkingMessages(conversationId)
          store.finalizeStream(conversationId)
          if (hadTokens) {
            // Real streamed answer — finalized, stop thinking
            streamFinalizedRef.current.add(conversationId)
            store.setThinking(conversationId, false)
          }
          // No tokens → tool-call iteration; keep thinking=true so the spinner persists
          break
        }

        case 'AGENT_END': {
          store.clearThinkingMessages(conversationId)

          if (streamFinalizedRef.current.has(conversationId)) {
            // RESPONSE_END already finalized the stream — nothing more to add
            streamFinalizedRef.current.delete(conversationId)
          } else {
            // RESPONSE_END did not fire (non-streaming path, e.g. tool-only turns)
            // Read CURRENT stream state — not the stale closure value
            const currentStream = useChatStore.getState().streamingContent[conversationId]
            if (currentStream) {
              store.finalizeStream(conversationId)
            } else if (event.content) {
              store.addMessage(conversationId, {
                id: Date.now().toString() + Math.random(),
                role: 'assistant',
                content: event.content,
              })
            }
          }

          store.setThinking(conversationId, false)
          break
        }

        case 'THINKING':
          store.setThinking(conversationId, true)
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

        case 'PROACTIVE_ALERT':
          if (event.content) {
            store.addProactiveAlert(event.content)
          }
          break

        default:
          break
      }
    }

    const eventTypes = [
      'THINKING', 'TOOL_CALL', 'TOOL_RESULT', 'TOOL_ERROR',
      'FORM_REQUEST', 'FORM_RESOLVED', 'TOKEN', 'STREAM_RESET',
      'RESPONSE_START', 'RESPONSE_END', 'AGENT_START', 'AGENT_END', 'ERROR',
      'ITERATION_START', 'ITERATION_END', 'PROACTIVE_ALERT',
      // Multi-agent ("swarm") events — must be listed so EventSource delivers them.
      'COORDINATION_PLAN', 'AGENT_SPAWNED', 'AGENT_STATUS', 'AGENT_MESSAGE',
      'TASK_CREATED', 'TASK_UPDATED',
    ]

    eventTypes.forEach(type => {
      es.addEventListener(type, handleEvent(type))
    })

    return () => {
      es.close()
      esRef.current = null
    }
  }, [conversationId]) // onEvent intentionally omitted — onEventRef keeps it current without reconnecting
}
