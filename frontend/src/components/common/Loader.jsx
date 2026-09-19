import { Loader2 } from 'lucide-react'

export default function Loader({ label = 'Loading…', fullPage = false, className = '' }) {
  const content = (
    <div className={`flex items-center justify-center gap-2 text-sm text-gray-500 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin text-accent" />
      <span>{label}</span>
    </div>
  )
  if (fullPage) {
    return <div className="flex h-64 items-center justify-center">{content}</div>
  }
  return content
}
