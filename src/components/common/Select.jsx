import { ChevronDown } from 'lucide-react'

export default function Select({ label, options = [], error, className = '', id, ...rest }) {
  const selectId = id || rest.name
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label ? (
        <label htmlFor={selectId} className="text-xs font-medium text-gray-600">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-8 text-sm text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/25 ${
            error ? 'border-red-400' : 'border-gray-300 focus:border-accent'
          }`}
          {...rest}
        >
          {options.map((option) => {
            const value = typeof option === 'object' ? option.value : option
            const text = typeof option === 'object' ? option.label : option
            return (
              <option key={value} value={value}>
                {text}
              </option>
            )
          })}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  )
}
