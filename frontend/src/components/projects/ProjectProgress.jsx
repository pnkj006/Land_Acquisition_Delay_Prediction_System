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

  const enumMatch = STAGES.find(
    (item) => item.value === value,
  )

  if (enumMatch) return enumMatch.value

  const labelMatch = STAGES.find(
    (item) =>
      item.label.toLowerCase() === value.toLowerCase(),
  )

  return labelMatch ? labelMatch.value : ''
}

export default function ProjectProgress({
  currentStage,
  stages = [],
  loading = false,
}) {
  const normalizedCurrentStage = normalizeStage(currentStage)

  /*
   * Convert API stages into:
   *
   * {
   *   NOTIFICATION: 90,
   *   APPROVAL: 0,
   *   LAND_ACQUISITION: 0,
   *   ...
   * }
   */
  const progressMap = {}

  stages.forEach((item) => {
    const stage = normalizeStage(item?.stage)

    if (!stage) return

    const percentage = Number(item?.progressPct)

    progressMap[stage] = Number.isFinite(percentage)
      ? percentage
      : 0
  })

  console.log('ProjectProgress stages:', stages)
  console.log('ProjectProgress progressMap:', progressMap)
  console.log(
    'ProjectProgress currentStage:',
    normalizedCurrentStage,
  )

  const currentIndex = STAGES.findIndex(
    (stage) => stage.value === normalizedCurrentStage,
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
        const backendProgress = progressMap[stage.value] ?? 0

        const isCompleted =
          currentIndex !== -1 &&
          index < currentIndex

        const isCurrent =
          currentIndex !== -1 &&
          index === currentIndex

        const isPending =
          !isCompleted && !isCurrent

        // Previous stages = 100%
        // Current stage = backend percentage
        // Future stages = backend percentage / 0
        const displayProgress = isCompleted
          ? 100
          : Math.min(
              100,
              Math.max(0, backendProgress),
            )

        return (
          <div
            key={stage.value}
            className="flex items-center gap-3"
          >
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