import Select from './Select.jsx'

export default function FilterDropdown({ options = [], value, onChange, label = 'Filter', allLabel = null, className = '' }) {
  const allOption = allLabel ? { value: '', label: allLabel } : null
  const selectOptions = allOption ? [allOption, ...options] : options

  return (
    <Select
      options={selectOptions}
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      aria-label={label}
      className={`min-w-[130px] ${className}`}
    />
  )
}
