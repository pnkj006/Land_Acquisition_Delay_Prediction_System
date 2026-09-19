import { Search } from 'lucide-react'

export default function SearchBar({ placeholder = 'Search…', value, onChange, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
      />
    </div>
  )
}
