import { cn } from "@/lib/utils"

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
}

/**
 * Circular progress indicator with neon glow
 */
export function ProgressRing({ progress, size = 120, strokeWidth = 8, className }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className={cn("relative", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle className="stroke-muted" fill="none" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2} />
        <circle
          className="stroke-primary transition-all duration-300"
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ filter: "drop-shadow(0 0 6px var(--primary))" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-xl font-bold text-primary">
        {Math.round(progress)}%
      </span>
    </div>
  )
}
