import { useCallback, useReducer } from 'react'
import type {
  AgentEvent, SwarmState, SwarmAgent, SwarmTask, SwarmMessage,
  SwarmAgentStatus, SwarmTaskStatus,
} from '../types'

const EMPTY: SwarmState = {
  active: false,
  planSummary: null,
  agents: {},
  tasks: {},
  messages: [],
}

type Action = { type: 'event'; event: AgentEvent } | { type: 'reset' }

// Pure reducer so the event-folding logic is trivially testable in isolation.
export function swarmReducer(state: SwarmState, action: Action): SwarmState {
  if (action.type === 'reset') return EMPTY

  const e = action.event
  const meta = (e.metadata ?? {}) as Record<string, unknown>
  const str = (k: string): string | undefined =>
    typeof meta[k] === 'string' ? (meta[k] as string) : undefined

  switch (e.type) {
    case 'AGENT_START':
      // A fresh turn begins — clear any prior run's swarm state.
      return { ...EMPTY, active: true }

    case 'AGENT_SPAWNED': {
      const id = str('agentId') ?? str('role') ?? e.id
      const agent: SwarmAgent = {
        id,
        role: str('role') ?? id,
        displayName: str('displayName') ?? id,
        model: str('model') ?? 'default',
        color: str('color'),
        status: (str('status') as SwarmAgentStatus) ?? 'idle',
      }
      return { ...state, active: true, agents: { ...state.agents, [id]: agent } }
    }

    case 'AGENT_STATUS': {
      const id = str('agentId') ?? str('role')
      if (!id || !state.agents[id]) return state
      const status = (str('status') as SwarmAgentStatus) ?? state.agents[id].status
      return { ...state, agents: { ...state.agents, [id]: { ...state.agents[id], status } } }
    }

    case 'COORDINATION_PLAN':
      return { ...state, planSummary: e.content || 'Plan ready' }

    case 'AGENT_MESSAGE': {
      const msg: SwarmMessage = {
        id: e.id,
        from: str('from') ?? 'agent',
        to: str('to'),
        type: str('msgType') ?? 'MESSAGE',
        content: e.content ?? '',
      }
      // Cap retained messages so a long run cannot grow state unbounded.
      const messages = [...state.messages, msg].slice(-200)
      return { ...state, messages }
    }

    case 'TASK_CREATED': {
      const id = str('taskId') ?? e.id
      const dependsOn = Array.isArray(meta.dependsOn) ? (meta.dependsOn as string[]) : []
      const task: SwarmTask = {
        id,
        role: str('role') ?? '',
        goal: e.content ?? '',
        dependsOn,
        status: 'pending',
        attempt: 0,
      }
      return { ...state, tasks: { ...state.tasks, [id]: task } }
    }

    case 'TASK_UPDATED': {
      const id = str('taskId')
      if (!id) return state
      const prev = state.tasks[id]
      const status = (str('status') as SwarmTaskStatus) ?? prev?.status ?? 'pending'
      const attempt = typeof meta.attempt === 'number' ? (meta.attempt as number) : prev?.attempt ?? 0
      const resultSnippet = e.content || prev?.resultSnippet
      const task: SwarmTask = prev
        ? { ...prev, status, attempt, resultSnippet }
        : { id, role: '', goal: '', dependsOn: [], status, attempt, resultSnippet }
      return { ...state, tasks: { ...state.tasks, [id]: task } }
    }

    case 'AGENT_END':
      return { ...state, active: false }

    default:
      return state
  }
}

/**
 * Builds live multi-agent ("swarm") state from the SSE event stream. The owner wires
 * {@link handleEvent} into its existing `useSSE` callback; this hook keeps no socket of its own.
 */
export function useAgentSwarm() {
  const [swarm, dispatch] = useReducer(swarmReducer, EMPTY)

  const handleEvent = useCallback((event: AgentEvent) => {
    dispatch({ type: 'event', event })
  }, [])

  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  return { swarm, handleEvent, reset }
}
