import { Check, Circle } from 'lucide-react'

const STAGES = [
  { value: 'NOTIFICATION', label: 'Notification' },
  { value: 'APPROVAL', label: 'Approval' },
  { value: 'LAND_ACQUISITION', label: 'Land Acquisition' },
  { value: 'COMPENSATION', label: 'Compensation' },
  { value: 'REHABILITATION', label: 'Rehabilitation' },
  { value: 'POSSESSION', label: 'Possession' },
]

function normalizeStage(stage) {
  if (!stage) return ''

  const value = String(stage).trim()

  // Exact enum match
  const enumMatch = STAGES.find(
    (item) => item.value === value,
  )

  if (enumMatch) {
    return enumMatch.value
  }

  // Label match
  const labelMatch = STAGES.find(
    (item) =>
      item.label.toLowerCase() === value.toLowerCase(),
  )

  if (labelMatch) {
    return labelMatch.value
  }

  // Handle common variations
  const normalized = value
    .toUpperCase()
    .replace(/[\s-]+/g, '_')

  const normalizedMatch = STAGES.find(
    (item) => item.value === normalized,
  )

  return normalizedMatch ? normalizedMatch.value : ''
}

/**
 * Safely extract progress from backend.
 *
 * Supports:
 *   progressPct
 *   progress_pct
 *   progress
 *   progressPercentage
 */
function getProgressValue(item) {
  if (!item) return 0

  const rawValue =
    item.progressPct ??
    item.progress_pct ??
    item.progressPercentage ??
    item.progress ??
    0

  const value = Number(rawValue)

  if (!Number.isFinite(value)) {
    console.warn(
      'Invalid stage progress value:',
      item,
    )

    return 0
  }

  return Math.min(
    100,
    Math.max(0, value),
  )
}

export default function ProjectProgress({
  currentStage,
  stages = [],
  loading = false,
}) {
  const normalizedCurrentStage =
    normalizeStage(currentStage)

  /*
   * Convert backend stages into:
   *
   * {
   *   NOTIFICATION: 100,
   *   APPROVAL: 80,
   *   LAND_ACQUISITION: 45,
   *   COMPENSATION: 20
   * }
   */

  const progressMap = {}

  if (Array.isArray(stages)) {
    stages.forEach((item) => {
      const stage = normalizeStage(item?.stage)

      if (!stage) {
        console.warn(
          'Unknown stage received from backend:',
          item,
        )

        return
      }

      progressMap[stage] =
        getProgressValue(item)
    })
  }

  console.log(
    '========== PROJECT PROGRESS ==========',
  )

  console.log(
    'Raw stages:',
    stages,
  )

  console.log(
    'Current stage from API:',
    currentStage,
  )

  console.log(
    'Normalized current stage:',
    normalizedCurrentStage,
  )

  console.log(
    'Progress map:',
    progressMap,
  )

  console.log(
    '======================================',
  )

  const currentIndex = STAGES.findIndex(
    (stage) =>
      stage.value === normalizedCurrentStage,
  )

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {STAGES.map((stage) => (
          <div
            key={stage.value}
            className="flex items-center gap-3 animate-pulse"
          >
            <div className="h-8 w-8 shrink-0 rounded-full bg-gray-100" />

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="h-3 w-24 rounded bg-gray-100" />

                <div className="h-3 w-20 rounded bg-gray-100" />
              </div>

              <div className="mt-2 h-1.5 rounded-full bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {STAGES.map((stage, index) => {
        const backendProgress =
          progressMap[stage.value] ?? 0

        const isCompleted =
          currentIndex !== -1 &&
          index < currentIndex

        const isCurrent =
          currentIndex !== -1 &&
          index === currentIndex

        const isPending =
          !isCompleted && !isCurrent

        /*
         * Previous stages:
         * automatically considered 100%
         *
         * Current stage:
         * use backend progress
         *
         * Future stages:
         * use backend progress if available
         */
        const displayProgress = isCompleted
          ? 100
          : backendProgress

        return (
          <div
            key={stage.value}
            className="flex items-center gap-3"
          >
            {/* Stage icon */}
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                isCompleted
                  ? 'bg-green-100 text-green-600'
                  : isCurrent
                    ? 'bg-accent/10 text-accent'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isCompleted ? (
                <Check size={16} />
              ) : (
                <Circle size={12} />
              )}
            </div>

            {/* Stage information */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p
                  className={`text-sm font-semibold ${
                    isPending
                      ? 'text-gray-400'
                      : 'text-gray-800'
                  }`}
                >
                  {stage.label}
                </p>

                <span
                  className={`text-xs font-medium ${
                    isCompleted
                      ? 'text-green-600'
                      : isCurrent
                        ? 'text-accent'
                        : 'text-gray-400'
                  }`}
                >
                  {isCompleted
                    ? 'Completed · 100%'
                    : isCurrent
                      ? `Current · ${displayProgress}%`
                      : `Pending · ${displayProgress}%`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted
                      ? 'bg-green-500'
                      : isCurrent
                        ? 'bg-accent'
                        : 'bg-transparent'
                  }`}
                  style={{
                    width: `${displayProgress}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}