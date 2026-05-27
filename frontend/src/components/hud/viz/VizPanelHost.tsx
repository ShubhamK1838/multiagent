import React from 'react'
import { AnimatePresence } from 'framer-motion'
import { TablePanel } from './TablePanel'
import { ChartPanel } from './ChartPanel'
import { CodePanel } from './CodePanel'
import { JsonPanel } from './JsonPanel'
import { DiffPanel } from './DiffPanel'
import { MetricsPanel } from './MetricsPanel'
import { NetworkPanel } from './NetworkPanel'
import { GlobePanel } from './GlobePanel'
import { ScatterPanel3D } from './ScatterPanel3D'
import type { VizPanelState, VizPanelKey } from '../../../hooks/useVizPanels'

interface VizPanelHostProps {
  panels: VizPanelState
  onDismiss: (key: VizPanelKey) => void
}

export const VizPanelHost: React.FC<VizPanelHostProps> = ({ panels, onDismiss }) => (
  <AnimatePresence>
    {panels.table     && <TablePanel     key="table"     data={panels.table}     onClose={() => onDismiss('table')} />}
    {panels.chart     && <ChartPanel     key="chart"     data={panels.chart}     onClose={() => onDismiss('chart')} />}
    {panels.code      && <CodePanel      key="code"      data={panels.code}      onClose={() => onDismiss('code')} />}
    {panels.json      && <JsonPanel      key="json"      data={panels.json}      onClose={() => onDismiss('json')} />}
    {panels.diff      && <DiffPanel      key="diff"      data={panels.diff}      onClose={() => onDismiss('diff')} />}
    {panels.metrics   && <MetricsPanel   key="metrics"   data={panels.metrics}   onClose={() => onDismiss('metrics')} />}
    {panels.network   && <NetworkPanel   key="network"   data={panels.network}   onClose={() => onDismiss('network')} />}
    {panels.globe     && <GlobePanel     key="globe"     data={panels.globe}     onClose={() => onDismiss('globe')} />}
    {panels.scatter3d && <ScatterPanel3D key="scatter3d" data={panels.scatter3d} onClose={() => onDismiss('scatter3d')} />}
  </AnimatePresence>
)
