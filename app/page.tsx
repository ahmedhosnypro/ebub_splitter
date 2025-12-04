"use client"

import { useTheme } from "@/hooks/use-theme"
import { AppHeader } from "@/components/header/app-header"
import { EpubExtractor } from "@/components/epub-extractor"

/**
 * Main application page
 */
export default function HomePage() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="relative min-h-screen scanlines">
      <AppHeader isDark={isDark} onToggleTheme={toggleTheme} />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <IntroSection />
        <EpubExtractor />
      </main>

      <Footer />
    </div>
  )
}

function IntroSection() {
  return (
    <section className="mb-8 text-center">
      <h2 className="mb-2 font-mono text-2xl font-bold text-foreground">
        Extract <span className="text-primary">Chapters</span>
      </h2>
      <p className="text-muted-foreground">
        Upload an EPUB, select chapters, and download a new file with only the content you need.
      </p>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border py-4 text-center">
      <p className="font-mono text-xs text-muted-foreground">100% client-side • Your files never leave your device</p>
    </footer>
  )
}
