"use client"

import { useCallback, useEffect, useState } from "react"

type Theme = "dark" | "light"

interface UseThemeReturn {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
}

/**
 * Hook for managing app theme
 */
export function useTheme(): UseThemeReturn {
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null
    const initial = stored ?? "dark"
    setTheme(initial)
    applyTheme(initial)
  }, [])

  const applyTheme = (t: Theme) => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(t)
  }

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      localStorage.setItem("theme", next)
      applyTheme(next)
      return next
    })
  }, [])

  return { theme, toggleTheme, isDark: theme === "dark" }
}
