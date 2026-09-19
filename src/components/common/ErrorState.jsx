import { AlertCircle } from 'lucide-react'
import Button from './Button.jsx'

export default function ErrorState({ message = 'Something went wrong.', onRetry, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 py-10 text-center ${className}`}>
      <div className="rounded-full bg-red-50 p-3 text-red-500">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h4 className="text-sm font-semibold text-gray-700">Error</h4>
      <p className="max-w-xs text-xs text-gray-500">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          Retry
        </Button>
      ) : null}
    </div>
  )
}
