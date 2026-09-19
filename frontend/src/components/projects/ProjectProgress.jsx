import { CheckCircle2, Circle, CircleDot } from 'lucide-react'
import ProgressBar from '../common/ProgressBar.jsx'
import { PROJECT_STAGES } from '../../utils/constants'

export default function ProjectProgress({ currentStage }) {
  const currentIndex = PROJECT_STAGES.indexOf(currentStage)

  return (
    <div className="relative flex flex-col gap-3.5">
      {/* Vertical connector line linking the stage markers */}
      {currentIndex >= 0 && currentIndex < PROJECT_STAGES.length - 1 ? (
        <span
          className="pointer-events-none absolute bottom-5 left-[9px] top-5 w-px bg-gray-200"
          aria-hidden="true"
        />
      ) : null}
      {PROJECT_STAGES.map((stage, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        const isPending = index > currentIndex

        // Done stages = 100%, current = 50%, pending = 0%.
        const percent = isDone ? 100 : isCurrent ? 50 : 0
        const barColor = isDone ? 'bg-green-500' : isCurrent ? 'bg-primary' : 'bg-gray-300'

        return (
          <div key={stage} className="relative flex items-center gap-3">
            <div className="relative z-10 flex w-5 shrink-0 justify-center">
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white">
                {isDone ? (
                  <CheckCircle2 className="h-[18px] w-[18px] text-green-500" />
                ) : isCurrent ? (
                  <CircleDot className="h-[18px] w-[18px] text-primary" />
                ) : (
                  <Circle className="h-[18px] w-[18px] text-gray-300" />
                )}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between">
                <p className={`text-xs font-medium ${isCurrent ? 'text-gray-800' : isDone ? 'text-gray-600' : 'text-gray-400'}`}>
                  {stage}
                </p>
                <span className={`text-[10px] font-semibold ${isCurrent ? 'text-primary' : 'text-gray-400'}`}>
                  {isCurrent ? 'In Progress' : isDone ? 'Completed' : 'Pending'} · {percent}%
                </span>
              </div>
              <ProgressBar value={percent} color={barColor} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
