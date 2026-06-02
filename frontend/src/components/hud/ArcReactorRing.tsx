import React from 'react'

interface ArcReactorRingProps {
  active: boolean // true while TTS is speaking or AI is processing
  size?: number
}

// Static reactor indicator for the command bar. Brightens when active but no
// longer animates (expanding rings / rotating hex / pulsing removed).
export const ArcReactorRing: React.FC<ArcReactorRingProps> = ({ active, size = 32 }) => (
  <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
    {/* Inner core */}
    <div
      className="absolute rounded-full"
      style={{
        width: size * 0.55,
        height: size * 0.55,
        background: active
          ? 'radial-gradient(circle, rgba(0,212,255,0.9) 0%, rgba(0,212,255,0.3) 60%, transparent 100%)'
          : 'radial-gradient(circle, rgba(0,212,255,0.4) 0%, rgba(0,212,255,0.1) 60%, transparent 100%)',
        boxShadow: active ? '0 0 12px rgba(0,212,255,0.8), 0 0 4px rgba(0,212,255,1)' : 'none',
        opacity: active ? 1 : 0.5,
      }}
    />

    {/* Static outer ring */}
    <div
      className="absolute rounded-full border"
      style={{
        width: size,
        height: size,
        borderColor: active ? 'rgba(0,212,255,0.6)' : 'rgba(0,212,255,0.25)',
        borderWidth: 1,
      }}
    />
  </div>
)
