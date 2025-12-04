import { formatTime } from "@/lib/utils/time"
import type { ProcessingState } from "@/lib/epub/types"

interface ProgressStatsProps {
  state: ProcessingState
}

/**
 * Displays processing statistics
 */
export function ProgressStats({ state }: ProgressStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 text-center font-mono">
      <StatItem label="Chapters" value={`${state.currentChapter}/${state.totalChapters}`} />
      <StatItem label="Elapsed" value={formatTime(state.elapsedTime)} />
      <StatItem label="Remaining" value={formatTime(state.estimatedRemaining)} />
      <StatItem label="Status" value={state.status.toUpperCase()} />
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary/50 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-primary">{value}</p>
    </div>
  )
}
