"use client"

import { FileText } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"

interface AppHeaderProps {
  isDark: boolean
  onToggleTheme: () => void
}

/**
 * Application header with branding and theme toggle
 */
export function AppHeader({ isDark, onToggleTheme }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <Logo />
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>
    </header>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-primary/10 p-2 neon-glow">
        <FileText className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="font-mono text-xl font-bold tracking-wider text-foreground">
          EPUB<span className="text-primary">_</span>SPLITTER
        </h1>
        <p className="text-xs text-muted-foreground">Extract chapters with ease</p>
      </div>
    </div>
  )
}
