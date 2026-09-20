export default function Input({ label, error, className = '', id, endAdornment, ...rest }) {
  const inputId = id || rest.name
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label ? (
        <label htmlFor={inputId} className="text-xs font-medium text-gray-600">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={inputId}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/25 ${endAdornment ? 'pr-10' : ''} ${
            error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-accent'
          }`}
          {...rest}
        />
        {endAdornment ? <div className="absolute inset-y-0 right-0 flex items-center pr-2">{endAdornment}</div> : null}
      </div>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  )
}
