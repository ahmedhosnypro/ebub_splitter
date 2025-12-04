import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface NeonBorderProps {
  children: ReactNode
  className?: string
  variant?: "primary" | "accent"
}

/**
 * Cyberpunk-styled container with neon border effect
 */
export function NeonBorder({ children, className, variant = "primary" }: NeonBorderProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg p-[1px]",
        variant === "primary"
          ? "bg-gradient-to-r from-primary/50 via-primary to-primary/50"
          : "bg-gradient-to-r from-accent/50 via-accent to-accent/50",
        className,
      )}
    >
      <div className="rounded-lg bg-card">{children}</div>
    </div>
  )
}
