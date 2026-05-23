import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Float, Text, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { useAiModels } from '../aimodels/useAiModels'
import type { AiModel } from '../../types'
import { LoadingDots } from '../shared/LoadingDots'
import { useHandTracking } from '../../hooks/useHandTracking'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

// A glowing podium for the "armor" (the AI model)
function Podium({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[1.5, 1.8, 0.4, 32]} />
        <meshStandardMaterial color="#020b18" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Glowing inner ring */}
      <mesh position={[0, 0.01, 0]}>
        <ringGeometry args={[1.2, 1.4, 32]} />
        <meshBasicMaterial color="#00d4ff" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
      {/* Inner dark center */}
      <mesh position={[0, 0.01, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshStandardMaterial color="#010409" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}

// A 3D representation of an AI model (the "Armor")
function ArmorSuit({ model, position, isActive }: { model: AiModel, position: [number, number, number], isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)

  // Slowly rotate the suit
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2
    }
  })

  const primaryColor = isActive ? '#00d4ff' : '#4a5568'
  const glowColor = isActive ? '#00ffff' : '#1a202c'

  return (
    <group position={position}>
      <Podium position={[0, 0, 0]} />

      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
        <group ref={groupRef} position={[0, 1.5, 0]}>
          {/* Main Body (representing the model's core) */}
          <mesh ref={meshRef}>
            <octahedronGeometry args={[0.8, 2]} />
            <meshStandardMaterial
              color={primaryColor}
              metalness={0.9}
              roughness={0.1}
              emissive={glowColor}
              emissiveIntensity={isActive ? 0.5 : 0.1}
              wireframe={!isActive}
            />
          </mesh>

          {/* Inner Core */}
          <mesh>
            <icosahedronGeometry args={[0.4, 1]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>

          {/* Floating Data Rings */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.02, 16, 64]} />
            <meshBasicMaterial color={primaryColor} transparent opacity={0.6} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[1.4, 0.02, 16, 64]} />
            <meshBasicMaterial color={primaryColor} transparent opacity={0.4} />
          </mesh>

          {/* Holographic Text Info */}
          <Text
            position={[0, 1.5, 0]}
            fontSize={0.25}
            color="#00d4ff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/Inter-Bold.woff" // Fallback to default if needed
          >
            {model.name}
          </Text>
          <Text
            position={[0, 1.2, 0]}
            fontSize={0.12}
            color="#a0aec0"
            anchorX="center"
            anchorY="middle"
          >
            {model.provider} - {model.modelId}
          </Text>
        </group>
      </Float>
    </group>
  )
}

function HallEnvironment({ models }: { models: AiModel[] }) {
  // Arrange models in a semi-circle around the camera
  const radius = 6
  const count = models.length;

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 10]} intensity={1} color="#00d4ff" />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#00d4ff" distance={20} />

      {/* Grid Floor */}
      <gridHelper args={[50, 50, '#00d4ff', '#020b18']} position={[0, -0.19, 0]} />

      <ContactShadows position={[0, -0.18, 0]} opacity={0.4} scale={20} blur={2} far={4} />

      {models.map((model, index) => {
        // Calculate angle for semi-circle arrangement
        // If 1 model, put it at 0. If multiple, spread from -PI/3 to PI/3
        const angle = count === 1 ? 0 : (-Math.PI / 3) + (index / (count - 1)) * (Math.PI * 2 / 3)
        const x = Math.sin(angle) * radius
        const z = -Math.cos(angle) * radius

        return (
          <ArmorSuit
            key={model.id}
            model={model}
            position={[x, 0, z]}
            isActive={model.default}
          />
        )
      })}

      {/* Adding some environment map for nice reflections on metallic surfaces */}
      <Environment preset="city" />
    </>
  )
}

// Component to control camera via hand tracking
function HandTrackingControls() {
  const { isReady, dataRef } = useHandTracking()
  const controlsRef = useRef<OrbitControlsImpl>(null)

  // Keep track of previous coordinates to calculate deltas
  const lastPos = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)

  useFrame(() => {
    const data = dataRef.current
    if (!isReady || !data.isActive || !controlsRef.current) return

    // If pinching, rotate camera
    if (data.gesture === 'Pinch') {
      if (!isDragging.current) {
        // Just started pinching, record start position
        isDragging.current = true
        lastPos.current = { x: data.x, y: data.y }
      } else {
        // Currently pinching, calculate delta
        const deltaX = data.x - lastPos.current.x
        const deltaY = data.y - lastPos.current.y

        // Apply rotation (adjust sensitivity multiplier as needed)
        const sensitivity = 5.0

        // OrbitControls doesn't have setAzimuthalAngle/setPolarAngle.
        // Instead, we manually rotate the camera around the target using Spherical coordinates
        const controls = controlsRef.current
        const camera = controls.object as THREE.PerspectiveCamera
        const target = controls.target

        // Get current camera position relative to target
        const offset = new THREE.Vector3().copy(camera.position).sub(target)

        // Convert to spherical
        const spherical = new THREE.Spherical().setFromVector3(offset)

        // Apply rotation
        spherical.theta -= deltaX * sensitivity
        spherical.phi -= deltaY * sensitivity

        // Clamp phi (polar angle) to avoid flipping and going under the floor
        spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 + 0.1, spherical.phi))

        // Convert back to vector and apply to camera
        offset.setFromSpherical(spherical)
        camera.position.copy(target).add(offset)
        camera.lookAt(target)

        // Tell OrbitControls to update its internal state
        controls.update()

        lastPos.current = { x: data.x, y: data.y }
      }
    } else {
      isDragging.current = false
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      minDistance={2}
      maxDistance={15}
      maxPolarAngle={Math.PI / 2 + 0.1}
    />
  )
}

export function HallOfArmor() {
  const { models, loading, refresh } = useAiModels()
  const { isReady, uiSnapshot: data } = useHandTracking()

  useEffect(() => {
    refresh()
  }, [])

  if (loading && models.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#020b18] text-cyan-500 font-mono">
        <LoadingDots />
        <div className="mt-4 text-xs tracking-widest uppercase">Initializing Hall of Armor Protocol...</div>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#020b18] text-cyan-500 font-mono">
        <div className="text-xl mb-2">NO ARMOR DETECTED</div>
        <div className="text-sm opacity-60">Register AI models in the NEURAL panel to populate the Hall.</div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative bg-[#010409] overflow-hidden">
      {/* HUD Overlay Elements */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none font-mono text-xs text-cyan-500/70">
        <div className="mb-1 border-b border-cyan-500/30 pb-1">PROTOCOL: HALL OF ARMOR</div>
        <div>SUITS DEPLOYED: {models.length}</div>
        <div>ACTIVE CORE: {models.find(m => m.default)?.name || 'NONE'}</div>
        <div className="mt-2 text-[#00ff88]">
          GESTURE CAM: {isReady ? 'ONLINE' : 'INITIALIZING...'}
        </div>
        {isReady && data.isActive && (
          <div className="text-cyan-300">
            HAND DETECTED [Pinch to Rotate]
          </div>
        )}
      </div>

      {/* Crosshair showing virtual cursor position */}
      {isReady && data.isActive && (
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-cyan-400 z-20 pointer-events-none"
          style={{
            left: `${data.x * 100}%`,
            top: `${data.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            background: data.gesture === 'Pinch' ? 'rgba(0, 212, 255, 0.5)' : 'transparent',
            boxShadow: data.gesture === 'Pinch' ? '0 0 10px #00d4ff' : 'none',
            transition: 'background 0.1s, box-shadow 0.1s'
          }}
        />
      )}

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
        <color attach="background" args={['#010409']} />
        <fog attach="fog" args={['#010409', 5, 20]} />
        <Suspense fallback={null}>
          <HallEnvironment models={models} />
          <HandTrackingControls />
        </Suspense>
      </Canvas>
    </div>
  )
}
