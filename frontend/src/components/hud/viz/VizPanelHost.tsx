import React, { Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import { TablePanel } from './TablePanel'
import { ChartPanel } from './ChartPanel'
import { CodePanel } from './CodePanel'
import { JsonPanel } from './JsonPanel'
import { DiffPanel } from './DiffPanel'
import { MetricsPanel } from './MetricsPanel'
import type { VizPanelState, VizPanelKey } from '../../../hooks/useVizPanels'

// 3-D panels — lazy-loaded so R3F / Three.js are NOT in the critical bundle.
// This prevents a stale Vite dep cache from crashing the whole app.
const NetworkPanel   = React.lazy(() => import('./NetworkPanel').then(m => ({ default: m.NetworkPanel })))
const GlobePanel     = React.lazy(() => import('./GlobePanel').then(m => ({ default: m.GlobePanel })))
const ScatterPanel3D = React.lazy(() => import('./ScatterPanel3D').then(m => ({ default: m.ScatterPanel3D })))

const ThreeLoader: React.FC = () => (
  <div className="flex items-center justify-center h-32 text-[10px] font-mono text-cyan-400/40 tracking-widest">
    LOADING 3D ENGINE…
  </div>
)

interface VizPanelHostProps {
  panels: VizPanelState
  onDismiss: (key: VizPanelKey) => void
}

export const VizPanelHost: React.FC<VizPanelHostProps> = ({ panels, onDismiss }) => (
  <AnimatePresence>
    {panels.table     && <TablePanel   key="table"   data={panels.table}   onClose={() => onDismiss('table')} />}
    {panels.chart     && <ChartPanel   key="chart"   data={panels.chart}   onClose={() => onDismiss('chart')} />}
    {panels.code      && <CodePanel    key="code"    data={panels.code}    onClose={() => onDismiss('code')} />}
    {panels.json      && <JsonPanel    key="json"    data={panels.json}    onClose={() => onDismiss('json')} />}
    {panels.diff      && <DiffPanel    key="diff"    data={panels.diff}    onClose={() => onDismiss('diff')} />}
    {panels.metrics   && <MetricsPanel key="metrics" data={panels.metrics} onClose={() => onDismiss('metrics')} />}
    {panels.network   && (
      <Suspense key="network"   fallback={<ThreeLoader />}>
        <NetworkPanel   data={panels.network}   onClose={() => onDismiss('network')} />
      </Suspense>
    )}
    {panels.globe     && (
      <Suspense key="globe"     fallback={<ThreeLoader />}>
        <GlobePanel     data={panels.globe}     onClose={() => onDismiss('globe')} />
      </Suspense>
    )}
    {panels.scatter3d && (
      <Suspense key="scatter3d" fallback={<ThreeLoader />}>
        <ScatterPanel3D data={panels.scatter3d} onClose={() => onDismiss('scatter3d')} />
      </Suspense>
    )}
  </AnimatePresence>
)
