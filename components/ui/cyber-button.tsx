import { cn } from "@/lib/utils"
import type { ButtonHTMLAttributes, ReactNode } from "react"

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: "primary" | "secondary" | "accent"
  size?: "sm" | "md" | "lg"
}

/**
 * Cyberpunk-styled button with glow effects
 */
export function CyberButton({
  children,
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}: CyberButtonProps) {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  }
  const variantStyles = {
    primary: "bg-primary text-primary-foreground hover:neon-glow disabled:opacity-50",
    secondary: "bg-secondary text-secondary-foreground border border-border hover:border-primary",
    accent: "bg-accent text-accent-foreground hover:neon-glow-accent disabled:opacity-50",
  }

  return (
    <button
      className={cn(
        "font-mono font-bold uppercase tracking-wider transition-all duration-200 rounded-md",
        sizeStyles[size],
        variantStyles[variant],
        disabled && "cursor-not-allowed",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
