"use client"

import { Layers } from "lucide-react"

interface DepthSelectorProps {
  maxDepth: number
  currentDepth: number
  onDepthChange: (depth: number) => void
}

/**
 * Slider to select extraction depth for nested chapters
 */
export function DepthSelector({ maxDepth, currentDepth, onDepthChange }: DepthSelectorProps) {
  const depthLabels = Array.from({ length: maxDepth + 1 }, (_, i) => 
    i === 0 ? "Root only" : `Depth ${i}`
  )

  return (
    <div className="border-b border-border px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Extraction Depth</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {depthLabels[currentDepth]}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={maxDepth}
          value={currentDepth}
          onChange={(e) => onDepthChange(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
      
      <div className="flex justify-between mt-1">
        <span className="text-xs text-muted-foreground">0</span>
        <span className="text-xs text-muted-foreground">{maxDepth}</span>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        {currentDepth === 0 
          ? "Extract only top-level chapters"
          : `Extract chapters up to ${currentDepth} level${currentDepth > 1 ? 's' : ''} deep. Sub-chapters will be placed in subdirectories.`
        }
      </p>
    </div>
  )
}
