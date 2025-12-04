"use client"

import { calculateProgress } from "@/lib/utils/time"
import type { ProcessingState } from "@/lib/epub/types"
import { NeonBorder } from "@/components/ui/neon-border"
import { ProgressRing } from "@/components/ui/progress-ring"
import { ProgressStats } from "./progress-stats"

interface ProgressPanelProps {
  state: ProcessingState
}

/**
 * Processing progress display panel
 */
export function ProgressPanel({ state }: ProgressPanelProps) {
  const progress = calculateProgress(state.currentChapter, state.totalChapters)

  return (
    <NeonBorder variant="accent" className="w-full">
      <div className="flex flex-col items-center gap-6 rounded-lg bg-card p-6">
        <h3 className="font-mono text-lg font-bold uppercase tracking-wider text-accent">Processing</h3>
        <ProgressRing progress={progress} />
        <ProgressStats state={state} />
      </div>
    </NeonBorder>
  )
}
