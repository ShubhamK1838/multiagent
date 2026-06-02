import React, { Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import { TablePanel } from './TablePanel'
import { ChartPanel } from './ChartPanel'
import { CodePanel } from './CodePanel'
import { JsonPanel } from './JsonPanel'
import { DiffPanel } from './DiffPanel'
import { MetricsPanel } from './MetricsPanel'
import { GaugePanel } from './GaugePanel'
import { RadarPanel } from './RadarPanel'
import { TimelinePanel } from './TimelinePanel'
import { AnswerCardPanel } from './AnswerCardPanel'
import { ErrorBoundary } from '../../shared/ErrorBoundary'
import type { VizPanelState, VizPanelKey } from '../../../hooks/useVizPanels'

// 3-D panels — lazy-loaded so R3F / Three.js are NOT in the critical bundle.
// This prevents a stale Vite dep cache from crashing the whole app.
const NetworkPanel   = React.lazy(() => import('./NetworkPanel').then(m => ({ default: m.NetworkPanel })))
const GlobePanel     = React.lazy(() => import('./GlobePanel').then(m => ({ default: m.GlobePanel })))
const ScatterPanel3D = React.lazy(() => import('./ScatterPanel3D').then(m => ({ default: m.ScatterPanel3D })))
const Model3DPanel   = React.lazy(() => import('./Model3DPanel').then(m => ({ default: m.Model3DPanel })))

const ThreeLoader: React.FC = () => (
  <div className="flex items-center justify-center h-32 text-[10px] font-mono text-cyan-400/40 tracking-widest">
    LOADING 3D ENGINE…
  </div>
)

interface VizPanelHostProps {
  panels: VizPanelState
  onDismiss: (key: VizPanelKey) => void
}

// Wraps a single panel so malformed AI output throwing in render cannot take
// down the whole HUD. On error the offending panel is dismissed from state.
const SafePanel: React.FC<{
  panelKey: VizPanelKey
  data: unknown
  onDismiss: (key: VizPanelKey) => void
  children: React.ReactNode
}> = ({ panelKey, data, onDismiss, children }) => (
  <ErrorBoundary
    resetKeys={[data]}
    onError={() => {
      console.warn(`[VizPanelHost] panel "${panelKey}" failed to render — dismissing. Payload:`, data)
      // Defer state update out of the commit phase.
      queueMicrotask(() => onDismiss(panelKey))
    }}
  >
    {children}
  </ErrorBoundary>
)

export const VizPanelHost: React.FC<VizPanelHostProps> = ({ panels, onDismiss }) => (
  <AnimatePresence>
    {panels.table && (
      <SafePanel key="table" panelKey="table" data={panels.table} onDismiss={onDismiss}>
        <TablePanel data={panels.table} onClose={() => onDismiss('table')} />
      </SafePanel>
    )}
    {panels.chart && (
      <SafePanel key="chart" panelKey="chart" data={panels.chart} onDismiss={onDismiss}>
        <ChartPanel data={panels.chart} onClose={() => onDismiss('chart')} />
      </SafePanel>
    )}
    {panels.code && (
      <SafePanel key="code" panelKey="code" data={panels.code} onDismiss={onDismiss}>
        <CodePanel data={panels.code} onClose={() => onDismiss('code')} />
      </SafePanel>
    )}
    {panels.json && (
      <SafePanel key="json" panelKey="json" data={panels.json} onDismiss={onDismiss}>
        <JsonPanel data={panels.json} onClose={() => onDismiss('json')} />
      </SafePanel>
    )}
    {panels.diff && (
      <SafePanel key="diff" panelKey="diff" data={panels.diff} onDismiss={onDismiss}>
        <DiffPanel data={panels.diff} onClose={() => onDismiss('diff')} />
      </SafePanel>
    )}
    {panels.metrics && (
      <SafePanel key="metrics" panelKey="metrics" data={panels.metrics} onDismiss={onDismiss}>
        <MetricsPanel data={panels.metrics} onClose={() => onDismiss('metrics')} />
      </SafePanel>
    )}
    {panels.gauge && (
      <SafePanel key="gauge" panelKey="gauge" data={panels.gauge} onDismiss={onDismiss}>
        <GaugePanel data={panels.gauge} onClose={() => onDismiss('gauge')} />
      </SafePanel>
    )}
    {panels.radar && (
      <SafePanel key="radar" panelKey="radar" data={panels.radar} onDismiss={onDismiss}>
        <RadarPanel data={panels.radar} onClose={() => onDismiss('radar')} />
      </SafePanel>
    )}
    {panels.timeline && (
      <SafePanel key="timeline" panelKey="timeline" data={panels.timeline} onDismiss={onDismiss}>
        <TimelinePanel data={panels.timeline} onClose={() => onDismiss('timeline')} />
      </SafePanel>
    )}
    {panels.answer && (
      <SafePanel key="answer" panelKey="answer" data={panels.answer} onDismiss={onDismiss}>
        <AnswerCardPanel data={panels.answer} onClose={() => onDismiss('answer')} />
      </SafePanel>
    )}
    {panels.network && (
      <SafePanel key="network" panelKey="network" data={panels.network} onDismiss={onDismiss}>
        <Suspense fallback={<ThreeLoader />}>
          <NetworkPanel data={panels.network} onClose={() => onDismiss('network')} />
        </Suspense>
      </SafePanel>
    )}
    {panels.globe && (
      <SafePanel key="globe" panelKey="globe" data={panels.globe} onDismiss={onDismiss}>
        <Suspense fallback={<ThreeLoader />}>
          <GlobePanel data={panels.globe} onClose={() => onDismiss('globe')} />
        </Suspense>
      </SafePanel>
    )}
    {panels.scatter3d && (
      <SafePanel key="scatter3d" panelKey="scatter3d" data={panels.scatter3d} onDismiss={onDismiss}>
        <Suspense fallback={<ThreeLoader />}>
          <ScatterPanel3D data={panels.scatter3d} onClose={() => onDismiss('scatter3d')} />
        </Suspense>
      </SafePanel>
    )}
    {panels.model3d && (
      <SafePanel key="model3d" panelKey="model3d" data={panels.model3d} onDismiss={onDismiss}>
        <Suspense fallback={<ThreeLoader />}>
          <Model3DPanel data={panels.model3d} onClose={() => onDismiss('model3d')} />
        </Suspense>
      </SafePanel>
    )}
  </AnimatePresence>
)
