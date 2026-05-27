import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { VizPanelBase } from './VizPanelBase'
import type { GlobeData } from '../../../types'

interface GlobePanelProps { data: GlobeData; onClose: () => void }

// Convert lat/lon to 3D sphere point (radius r)
function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  )
}

const GLOBE_R = 2
const POINT_COLORS = ['#00d4ff', '#a855f7', '#34d399', '#fbbf24', '#f97316']

// ── Wireframe globe ────────────────────────────────────────────────────────────
const GlobeMesh: React.FC = () => (
  <mesh>
    <sphereGeometry args={[GLOBE_R, 36, 36]} />
    <meshStandardMaterial
      color="#001a33" wireframe={false}
      roughness={0.8} metalness={0.1}
      transparent opacity={0.55}
    />
  </mesh>
)

const GlobeWire: React.FC = () => (
  <mesh>
    <sphereGeometry args={[GLOBE_R + 0.01, 24, 24]} />
    <meshStandardMaterial color="#00d4ff" wireframe transparent opacity={0.08} />
  </mesh>
)

// ── Data point marker ─────────────────────────────────────────────────────────
const DataPoint: React.FC<{ lat: number; lon: number; label: string; value?: number; color: string }> = ({ lat, lon, value = 1, color }) => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const pos = useMemo(() => latLonToVec3(lat, lon, GLOBE_R + 0.04), [lat, lon])
  const size = Math.max(0.05, Math.min(0.22, 0.05 + value * 0.04))
  const c = new THREE.Color(color)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 2 + lat) * 0.15
      meshRef.current.scale.setScalar(s)
    }
  })

  return (
    <mesh ref={meshRef} position={pos}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1} transparent opacity={0.9} />
    </mesh>
  )
}

// ── Scene with slow auto-rotation ─────────────────────────────────────────────
const GlobeScene: React.FC<{ data: GlobeData }> = ({ data }) => {
  const groupRef = useRef<THREE.Group>(null!)
  useFrame(() => { if (groupRef.current) groupRef.current.rotation.y += 0.002 })

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[8, 4, 6]} intensity={1.4} color="#00d4ff" />
      <pointLight position={[-6, -4, -6]} intensity={0.5} color="#a855f7" />
      <group ref={groupRef}>
        <GlobeMesh />
        <GlobeWire />
        {data.points.map((p, i) => (
          <DataPoint
            key={i} lat={p.lat} lon={p.lon} label={p.label}
            value={p.value} color={POINT_COLORS[i % POINT_COLORS.length]}
          />
        ))}
      </group>
      <OrbitControls enablePan={false} enableZoom minDistance={3} maxDistance={9} />
    </>
  )
}

export const GlobePanel: React.FC<GlobePanelProps> = ({ data, onClose }) => (
  <VizPanelBase
    id="viz-globe"
    title={data.title} accent="#34d399" accentRgb="52,211,153"
    badge={`${data.points.length} pts`} onClose={onClose}
    initialLeft={Math.round((window.innerWidth - 440) / 2)} initialTop={90} width={440} maxHeight="70vh"
  >
    <div style={{ height: '400px' }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} gl={{ alpha: true, antialias: true }}>
        <GlobeScene data={data} />
      </Canvas>
    </div>
  </VizPanelBase>
)
