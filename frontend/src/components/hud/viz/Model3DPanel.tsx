import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { VizPanelBase } from './VizPanelBase'
import type { Model3DData, Model3DShape } from '../../../types'

interface Model3DPanelProps { data: Model3DData; onClose: () => void }

const Geometry: React.FC<{ shape: Model3DShape }> = ({ shape }) => {
  switch (shape) {
    case 'sphere':       return <sphereGeometry args={[1.3, 48, 48]} />
    case 'torus':        return <torusGeometry args={[1, 0.4, 24, 80]} />
    case 'cone':         return <coneGeometry args={[1.2, 2, 48]} />
    case 'cylinder':     return <cylinderGeometry args={[1, 1, 2, 48]} />
    case 'dodecahedron': return <dodecahedronGeometry args={[1.4, 0]} />
    case 'icosahedron':  return <icosahedronGeometry args={[1.4, 0]} />
    case 'torusknot':    return <torusKnotGeometry args={[0.9, 0.3, 128, 24]} />
    case 'cube':
    default:             return <boxGeometry args={[1.8, 1.8, 1.8]} />
  }
}

const SpinningModel: React.FC<{ data: Model3DData }> = ({ data }) => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const spin = data.spin ?? 1
  const color = data.color ?? '#00d4ff'
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5 * spin
      meshRef.current.rotation.x += delta * 0.2 * spin
    }
  })
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[5, 5, 5]} intensity={1.4} color="#00d4ff" />
      <pointLight position={[-5, -3, -4]} intensity={0.6} color="#a855f7" />
      <mesh ref={meshRef}>
        <Geometry shape={data.shape} />
        <meshStandardMaterial
          color={color}
          emissive={new THREE.Color(color)}
          emissiveIntensity={data.wireframe ? 0.9 : 0.35}
          roughness={0.25}
          metalness={0.6}
          wireframe={data.wireframe ?? false}
        />
      </mesh>
      <OrbitControls enablePan={false} enableZoom minDistance={3} maxDistance={12} />
    </>
  )
}

const VALID_SHAPES: Model3DShape[] = ['cube', 'sphere', 'torus', 'cone', 'cylinder', 'dodecahedron', 'icosahedron', 'torusknot']

export const Model3DPanel: React.FC<Model3DPanelProps> = ({ data, onClose }) => {
  const shape: Model3DShape = VALID_SHAPES.includes(data.shape) ? data.shape : 'cube'
  const safeData = { ...data, shape }
  return (
  <VizPanelBase
    id="viz-model3d"
    title={data.title ?? 'Model'} accent="#00d4ff" accentRgb="0,212,255"
    badge={shape.toUpperCase()} onClose={onClose}
    initialRight={20} initialTop={110} width={420} maxHeight="68vh"
    footer={data.label ? (
      <div className="text-[10px] font-mono text-cyan-400/60 tracking-wider text-center">{data.label}</div>
    ) : undefined}
  >
    <div style={{ height: '360px' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ alpha: true, antialias: true }}>
        <SpinningModel data={safeData} />
      </Canvas>
    </div>
  </VizPanelBase>
  )
}
