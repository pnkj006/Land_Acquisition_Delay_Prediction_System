import { ArrowUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { deriveProgress, isProjectAtRisk } from '../../utils/analyticsUtils'
import EmptyState from '../common/EmptyState.jsx'
import Pagination from '../common/Pagination.jsx'
import RiskBadge from '../common/RiskBadge.jsx'
import SearchBar from '../common/SearchBar.jsx'

const PAGE_SIZE = 5

const COLUMNS = [
  { key: 'id', label: 'Project ID' },
  { key: 'name', label: 'Project Name' },
  { key: 'district', label: 'District' },
  { key: 'type', label: 'Type' },
  { key: 'stage', label: 'Stage' },
  { key: 'riskLevel', label: 'Risk' },
  { key: 'progress', label: 'Progress' },
  { key: 'delayProbability', label: 'Delay Prob.' },
  { key: 'expectedDelayDays', label: 'Expected Delay' },
  { key: 'status', label: 'Status' },
]

/**
 * Backend stores delay probability as 0–1.
 *
 * Example:
 * 0.243333 -> 24.33%
 * 0.42     -> 42%
 * 0.53     -> 53%
 */
function getProbabilityPercent(project) {
  const value = Number(project?.delayProbability)

  if (!Number.isFinite(value)) return null

  return value * 100
}

/** Sortable value for a row/column. */
function sortValue(p, key) {
  if (key === 'progress') {
    return deriveProgress(p) ?? -1
  }

  if (key === 'delayProbability') {
    return getProbabilityPercent(p) ?? -1
  }

  if (key === 'status') {
    return isProjectAtRisk(p) ? 1 : 0
  }

  const value = p[key]

  return typeof value === 'number'
    ? value
    : String(value ?? '')
}

/**
 * Table state hook — search, sort, pagination.
 */
export function useProjectTable(projects = []) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({
    key: 'delayProbability',
    dir: 'desc',
  })
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return projects

    return projects.filter((p) =>
      [p.id, p.name, p.district].some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(q),
      ),
    )
  }, [projects, search])

  const sorted = useMemo(() => {
    const direction = sort.dir === 'asc' ? 1 : -1

    return [...filtered].sort((a, b) => {
      const av = sortValue(a, sort.key)
      const bv = sortValue(b, sort.key)

      if (
        typeof av === 'number' &&
        typeof bv === 'number'
      ) {
        return (av - bv) * direction
      }

      return (
        String(av).localeCompare(String(bv)) *
        direction
      )
    })
  }, [filtered, sort])

  const totalPages = Math.max(
    1,
    Math.ceil(sorted.length / PAGE_SIZE),
  )

  const safePage = Math.min(page, totalPages)

  const rows = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  const toggleSort = (key) => {
    setSort((previous) =>
      previous.key === key
        ? {
            key,
            dir:
              previous.dir === 'asc'
                ? 'desc'
                : 'asc',
          }
        : {
            key,
            dir: 'desc',
          },
    )

    setPage(1)
  }

  return {
    rows,
    total: sorted.length,
    safePage,
    totalPages,
    search,
    setSearch,
    sort,
    toggleSort,
    setPage,
  }
}

export default function ProjectPerformanceTable({
  projects = [],
  onViewProject,
}) {
  const {
    rows,
    total,
    safePage,
    totalPages,
    search,
    setSearch,
    sort,
    toggleSort,
    setPage,
  } = useProjectTable(projects)

  return (
    <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            Project Performance
          </h3>

          <p className="text-[11px] text-gray-400">
            Progress is a derived stage-position indicator,
            not measured physical progress
          </p>
        </div>

        <SearchBar
          placeholder="Search by ID, name or district…"
          value={search}
          onChange={setSearch}
          className="w-full sm:w-72"
        />
      </div>

      {total === 0 ? (
        <EmptyState
          title="No projects match the current search and filters."
          message="Adjust the filters above or clear the search."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wide text-gray-400">
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className="whitespace-nowrap py-2.5 pr-4 font-semibold"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          toggleSort(column.key)
                        }
                        className={`inline-flex items-center gap-1 transition-colors hover:text-gray-600 ${
                          sort.key === column.key
                            ? 'text-accent'
                            : ''
                        }`}
                      >
                        {column.label}

                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                  ))}

                  <th className="py-2.5 pr-4 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {rows.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    onViewProject={onViewProject}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  )
}

function ProjectRow({
  project: p,
  onViewProject,
}) {
  const progress = deriveProgress(p)
  const atRisk = isProjectAtRisk(p)

  const probability = getProbabilityPercent(p)

  return (
    <tr className="text-gray-700 transition-colors hover:bg-gray-50">
      {/* Project ID */}
      <td className="py-2.5 pr-4 font-semibold text-gray-800">
        {p.id}
      </td>

      {/* Project Name */}
      <td
        className="max-w-[180px] truncate py-2.5 pr-4"
        title={p.name}
      >
        {p.name}
      </td>

      {/* District */}
      <td className="whitespace-nowrap py-2.5 pr-4">
        {p.district || '—'}
      </td>

      {/* Type */}
      <td className="whitespace-nowrap py-2.5 pr-4">
        {p.type || '—'}
      </td>

      {/* Stage */}
      <td className="whitespace-nowrap py-2.5 pr-4">
        {p.stage || '—'}
      </td>

      {/* Risk */}
      <td className="py-2.5 pr-4">
        <RiskBadge level={p.riskLevel} />
      </td>

      {/* Derived Progress */}
      <td className="py-2.5 pr-4">
        {progress === null ? (
          '—'
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-accent"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <span className="tabular-nums text-gray-500">
              {progress}%
            </span>
          </div>
        )}
      </td>

      {/* Delay Probability */}
      <td className="py-2.5 pr-4 tabular-nums">
        {probability === null
          ? '—'
          : `${probability.toFixed(2)}%`}
      </td>

      {/* Expected Delay */}
      <td className="whitespace-nowrap py-2.5 pr-4 tabular-nums">
        {p.expectedDelayDays != null &&
        Number.isFinite(
          Number(p.expectedDelayDays),
        )
          ? `${Number(p.expectedDelayDays).toFixed(1)} days`
          : '—'}
      </td>

      {/* Status */}
      <td className="py-2.5 pr-4">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            atRisk
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {atRisk ? 'At Risk' : 'On Track'}
        </span>
      </td>

      {/* Action */}
      <td className="py-2.5 pr-4 text-right">
        <button
          type="button"
          onClick={() =>
            onViewProject &&
            onViewProject(p.id)
          }
          className="font-semibold text-accent transition-colors hover:text-accent-dark"
        >
          View
        </button>
      </td>
    </tr>
  )
}