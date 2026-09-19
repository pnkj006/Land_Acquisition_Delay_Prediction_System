export default function ProgressBar({ value = 0, color = 'bg-primary', showLabel = false, className = '' }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel ? <span className="w-9 shrink-0 text-right text-xs text-gray-500">{clamped}%</span> : null}
    </div>
  )
}
