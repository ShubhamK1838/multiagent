
interface ColorInputProps {
  value: string
  onChange: (v: string) => void
}

export function ColorInput({ value, onChange }: ColorInputProps) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value || '#7c3aed'}
        onChange={e => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
      />
      <span className="font-mono text-sm text-gray-300">{value || '#7c3aed'}</span>
    </div>
  )
}
