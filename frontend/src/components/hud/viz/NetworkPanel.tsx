import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import * as THREE from 'three'
import { VizPanelBase } from './VizPanelBase'
import type { NetworkData } from '../../../types'

interface NetworkPanelProps {
  data: NetworkData
  onClose: () => void
}

// ── 3D node simulation ────────────────────────────────────────────────────────
interface SimNode {
  id: string; label: string
  x: number; y: number; z: number
  vx: number; vy: number; vz: number
  color: string
}
interface SimEdge { source: string; target: string; color?: string }

const PALETTE = ['#00d4ff', '#a855f7', '#34d399', '#fbbf24', '#f97316', '#3b82f6']

function buildSimulation(nodes: NetworkData['nodes'], edges: NetworkData['edges']): [SimNode[], SimEdge[]] {
  const simNodes: SimNode[] = nodes.map((n, i) => ({
    id: n.id, label: n.label,
    x: (Math.sin(i * 2.4) * 3), y: (Math.cos(i * 1.7) * 2), z: (Math.sin(i * 1.1) * 2.5),
    vx: 0, vy: 0, vz: 0,
    color: n.color ?? PALETTE[i % PALETTE.length],
  }))
  const simEdges: SimEdge[] = edges.map(e => ({ source: e.source, target: e.target, color: e.color }))
  return [simNodes, simEdges]
}

// Force-directed tick (runs inside useFrame — no React state)
function applyForces(nodes: SimNode[], edges: SimEdge[]) {
  const REPULSE = 0.8, ATTRACT = 0.12, DAMPING = 0.88, CENTER = 0.015
  // Repulsion
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]
      const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z
      const d2 = dx*dx + dy*dy + dz*dz + 0.01
      const f = REPULSE / d2
      a.vx += dx * f; a.vy += dy * f; a.vz += dz * f
      b.vx -= dx * f; b.vy -= dy * f; b.vz -= dz * f
    }
  }
  // Attraction along edges
  const map = new Map(nodes.map(n => [n.id, n]))
  for (const e of edges) {
    const a = map.get(e.source), b = map.get(e.target)
    if (!a || !b) continue
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z
    a.vx += dx * ATTRACT; a.vy += dy * ATTRACT; a.vz += dz * ATTRACT
    b.vx -= dx * ATTRACT; b.vy -= dy * ATTRACT; b.vz -= dz * ATTRACT
  }
  // Centering + damping
  for (const n of nodes) {
    n.vx = (n.vx - n.x * CENTER) * DAMPING
    n.vy = (n.vy - n.y * CENTER) * DAMPING
    n.vz = (n.vz - n.z * CENTER) * DAMPING
    n.x += n.vx; n.y += n.vy; n.z += n.vz
  }
}

// ── Node mesh ─────────────────────────────────────────────────────────────────
const NodeSphere: React.FC<{ node: SimNode; index: number }> = ({ node }) => {
  const meshRef = useRef<THREE.Mesh>(null!)
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(node.x, node.y, node.z)
    }
  })
  const color = new THREE.Color(node.color)
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.12, 12, 12]} />
      <meshStandardMaterial
        color={color} emissive={color} emissiveIntensity={0.6}
        roughness={0.2} metalness={0.8}
      />
    </mesh>
  )
}

// ── Edge line ─────────────────────────────────────────────────────────────────
const EdgeLine: React.FC<{ a: SimNode; b: SimNode; color?: string }> = ({ a, b, color = '#00d4ff' }) => {
  const points = useMemo(() => [
    new THREE.Vector3(a.x, a.y, a.z),
    new THREE.Vector3(b.x, b.y, b.z),
  ], [a.x, a.y, a.z, b.x, b.y, b.z])

  useFrame(() => {
    points[0].set(a.x, a.y, a.z)
    points[1].set(b.x, b.y, b.z)
  })

  return <Line points={points} color={color} lineWidth={0.5} opacity={0.35} transparent />
}

// ── Scene ─────────────────────────────────────────────────────────────────────
const NetworkScene: React.FC<{ nodes: SimNode[]; edges: SimEdge[] }> = ({ nodes, edges }) => {
  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes])

  useFrame(() => { applyForces(nodes, edges) })

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#00d4ff" />
      <pointLight position={[-5, -3, -5]} intensity={0.6} color="#a855f7" />
      {nodes.map((n, i) => <NodeSphere key={n.id} node={n} index={i} />)}
      {edges.map((e, i) => {
        const a = nodeMap.get(e.source), b = nodeMap.get(e.target)
        if (!a || !b) return null
        return <EdgeLine key={i} a={a} b={b} color={e.color} />
      })}
      <OrbitControls enablePan={false} enableZoom minDistance={3} maxDistance={14} />
    </>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export const NetworkPanel: React.FC<NetworkPanelProps> = ({ data, onClose }) => {
  const [simNodes, simEdges] = useMemo(() => buildSimulation(data.nodes, data.edges), [data])
  const badge = `${data.nodes.length}n · ${data.edges.length}e`

  return (
    <VizPanelBase
      id="viz-network"
      title={data.title} accent="#a855f7" accentRgb="168,85,247"
      badge={badge} onClose={onClose}
      initialLeft={64} initialTop={110} width={460} maxHeight="72vh"
    >
      <div style={{ height: '380px' }}>
        <Canvas camera={{ position: [0, 0, 8], fov: 55 }} gl={{ alpha: true, antialias: true }}>
          <NetworkScene nodes={simNodes} edges={simEdges} />
        </Canvas>
      </div>
    </VizPanelBase>
  )
}
