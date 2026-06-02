import { useState, useCallback } from 'react'
import type {
  TableData, ChartData, CodeData, JsonData, DiffData, MetricsData,
  NetworkData, GlobeData, ScatterData,
  GaugeData, RadarData, Model3DData, TimelineData, AnswerCardData,
} from '../types'

export interface VizPanelState {
  table: TableData | null
  chart: ChartData | null
  code: CodeData | null
  json: JsonData | null
  diff: DiffData | null
  metrics: MetricsData | null
  network: NetworkData | null
  globe: GlobeData | null
  scatter3d: ScatterData | null
  gauge: GaugeData | null
  radar: RadarData | null
  model3d: Model3DData | null
  timeline: TimelineData | null
  answer: AnswerCardData | null
}

export type VizPanelKey = keyof VizPanelState

const INITIAL_STATE: VizPanelState = {
  table: null, chart: null, code: null, json: null, diff: null, metrics: null,
  network: null, globe: null, scatter3d: null,
  gauge: null, radar: null, model3d: null, timeline: null, answer: null,
}

const VIZ_KEYS = new Set<VizPanelKey>([
  'table', 'chart', 'code', 'json', 'diff', 'metrics',
  'network', 'globe', 'scatter3d',
  'gauge', 'radar', 'model3d', 'timeline', 'answer',
])

export function useVizPanels() {
  const [panels, setPanels] = useState<VizPanelState>(INITIAL_STATE)

  const dispatch = useCallback((eventName: string, payload: unknown) => {
    const key = eventName.replace('render_', '') as VizPanelKey
    if (VIZ_KEYS.has(key)) {
      setPanels(prev => ({ ...prev, [key]: payload }))
    }
  }, [])

  const dismiss = useCallback((key: VizPanelKey) => {
    setPanels(prev => ({ ...prev, [key]: null }))
  }, [])

  return { panels, dispatch, dismiss }
}
