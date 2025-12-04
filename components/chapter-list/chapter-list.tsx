"use client"

import type { EpubChapter } from "@/lib/epub/types"
import { NeonBorder } from "@/components/ui/neon-border"
import { ChapterItem } from "./chapter-item"
import { ChapterListHeader } from "./chapter-list-header"
import { DepthSelector } from "./depth-selector"

interface ChapterListProps {
  chapters: EpubChapter[]
  selectedIds: Set<string>
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onToggleExpand: (id: string) => void
  onToggleAllChildren: (chapter: EpubChapter) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onExpandAll: () => void
  onCollapseAll: () => void
  allSelected: boolean
  someSelected: boolean
  maxDepth: number
  extractionDepth: number
  onExtractionDepthChange: (depth: number) => void
  flattenOutput: boolean
  onToggleFlatten: () => void
}

/**
 * Scrollable list of selectable chapters with hierarchy support
 */
export function ChapterList({
  chapters,
  selectedIds,
  expandedIds,
  onToggle,
  onToggleExpand,
  onToggleAllChildren,
  onSelectAll,
  onDeselectAll,
  onExpandAll,
  onCollapseAll,
  allSelected,
  someSelected,
  maxDepth,
  extractionDepth,
  onExtractionDepthChange,
  flattenOutput,
  onToggleFlatten,
}: ChapterListProps) {
  const handleToggleAll = () => {
    if (allSelected) onDeselectAll()
    else onSelectAll()
  }

  const hasNestedChapters = maxDepth > 0

  return (
    <NeonBorder className="w-full">
      <div className="rounded-lg bg-card">
        <ChapterListHeader
          totalCount={selectedIds.size}
          selectedCount={selectedIds.size}
          allSelected={allSelected}
          someSelected={someSelected}
          onToggleAll={handleToggleAll}
          hasNestedChapters={hasNestedChapters}
          onExpandAll={onExpandAll}
          onCollapseAll={onCollapseAll}
          flattenOutput={flattenOutput}
          onToggleFlatten={onToggleFlatten}
        />
        
        {hasNestedChapters && (
          <DepthSelector
            maxDepth={maxDepth}
            currentDepth={extractionDepth}
            onDepthChange={onExtractionDepthChange}
          />
        )}

        <div className="max-h-80 overflow-y-auto p-2">
          {chapters.map((chapter) => (
            <ChapterItem
              key={chapter.id}
              chapter={chapter}
              isSelected={selectedIds.has(chapter.id)}
              isExpanded={expandedIds.has(chapter.id)}
              onToggle={() => onToggle(chapter.id)}
              onToggleExpand={() => onToggleExpand(chapter.id)}
              onSelectAllChildren={onToggleAllChildren}
              expandedIds={expandedIds}
              selectedIds={selectedIds}
              onToggleChapter={onToggle}
              onToggleExpandChapter={onToggleExpand}
            />
          ))}
        </div>
      </div>
    </NeonBorder>
  )
}
