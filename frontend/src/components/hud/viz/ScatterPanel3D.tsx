import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line, Text } from '@react-three/drei'
import * as THREE from 'three'
import { VizPanelBase } from './VizPanelBase'
import type { ScatterData } from '../../../types'

interface ScatterPanel3DProps { data: ScatterData; onClose: () => void }

const PALETTE = ['#00d4ff','#a855f7','#34d399','#fbbf24','#f97316','#3b82f6','#ec4899']

// ── Axis helper ───────────────────────────────────────────────────────────────
const Axes: React.FC<{ xLabel: string; yLabel: string; zLabel: string }> = ({ xLabel, yLabel, zLabel }) => {
  const len = 2.4
  const xPts = useMemo(() => [new THREE.Vector3(0,0,0), new THREE.Vector3(len,0,0)], [])
  const yPts = useMemo(() => [new THREE.Vector3(0,0,0), new THREE.Vector3(0,len,0)], [])
  const zPts = useMemo(() => [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,len)], [])
  return (
    <>
      <Line points={xPts} color="#f97316" lineWidth={1} opacity={0.7} transparent />
      <Line points={yPts} color="#34d399" lineWidth={1} opacity={0.7} transparent />
      <Line points={zPts} color="#3b82f6" lineWidth={1} opacity={0.7} transparent />
      <Text position={[len + 0.15, 0, 0]} fontSize={0.18} color="#f97316">{xLabel}</Text>
      <Text position={[0, len + 0.15, 0]} fontSize={0.18} color="#34d399">{yLabel}</Text>
      <Text position={[0, 0, len + 0.15]} fontSize={0.18} color="#3b82f6">{zLabel}</Text>
    </>
  )
}

// ── Normalizer ────────────────────────────────────────────────────────────────
function normalize(vals: number[]): number[] {
  const mn = Math.min(...vals), mx = Math.max(...vals)
  return mx === mn ? vals.map(() => 1) : vals.map(v => (v - mn) / (mx - mn) * 4 - 2)
}

// ── Scatter scene ─────────────────────────────────────────────────────────────
const ScatterScene: React.FC<{ data: ScatterData }> = ({ data }) => {
  const groupRef = useRef<THREE.Group>(null!)
  useFrame(() => { if (groupRef.current) groupRef.current.rotation.y += 0.003 })

  const points = useMemo(() => {
    const xs = normalize(data.points.map(p => p.x))
    const ys = normalize(data.points.map(p => p.y))
    const zs = normalize(data.points.map(p => p.z))
    return data.points.map((p, i) => ({ ...p, nx: xs[i], ny: ys[i], nz: zs[i] }))
  }, [data.points])

  // Group by series
  const seriesMap = useMemo(() => {
    const m = new Map<string, typeof points>()
    for (const p of points) {
      const s = p.series ?? 'default'
      if (!m.has(s)) m.set(s, [])
      m.get(s)!.push(p)
    }
    return m
  }, [points])

  const seriesNames = useMemo(() => [...seriesMap.keys()], [seriesMap])

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#00d4ff" />
      <pointLight position={[-5, -3, -4]} intensity={0.5} color="#a855f7" />
      <group ref={groupRef} position={[-1.2, -1.2, -1.2]}>
        <Axes xLabel={data.xLabel} yLabel={data.yLabel} zLabel={data.zLabel} />
        {seriesNames.map((sName, si) => {
          const color = new THREE.Color(PALETTE[si % PALETTE.length])
          return seriesMap.get(sName)!.map((p, pi) => (
            <mesh key={`${si}-${pi}`} position={[p.nx + 2, p.ny + 2, p.nz + 2]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} roughness={0.2} metalness={0.5} />
            </mesh>
          ))
        })}
      </group>
      <OrbitControls enablePan={false} enableZoom minDistance={3} maxDistance={14} />
    </>
  )
}

export const ScatterPanel3D: React.FC<ScatterPanel3DProps> = ({ data, onClose }) => (
  <VizPanelBase
    id="viz-scatter3d"
    title={data.title} accent="#3b82f6" accentRgb="59,130,246"
    badge={`${data.points.length} pts`} onClose={onClose}
    initialRight={20} initialTop={110} width={440} maxHeight="70vh"
  >
    <div style={{ height: '380px' }}>
      <Canvas camera={{ position: [5, 5, 7], fov: 52 }} gl={{ alpha: true, antialias: true }}>
        <ScatterScene data={data} />
      </Canvas>
    </div>
  </VizPanelBase>
)
