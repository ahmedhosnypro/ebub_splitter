"use client"

import { Check, ChevronRight, ChevronDown, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EpubChapter } from "@/lib/epub/types"

interface ChapterItemProps {
  chapter: EpubChapter
  isSelected: boolean
  isExpanded: boolean
  onToggle: () => void
  onToggleExpand: () => void
  onSelectAllChildren: (chapter: EpubChapter) => void
  expandedIds: Set<string>
  selectedIds: Set<string>
  onToggleChapter: (id: string) => void
  onToggleExpandChapter: (id: string) => void
}

/**
 * Gets all descendant IDs of a chapter
 */
function getAllDescendantIds(chapter: EpubChapter): string[] {
  const ids: string[] = []
  for (const child of chapter.children) {
    ids.push(child.id)
    ids.push(...getAllDescendantIds(child))
  }
  return ids
}

/**
 * Individual chapter list item with selection and expand/collapse for nested chapters
 */
export function ChapterItem({
  chapter,
  isSelected,
  isExpanded,
  onToggle,
  onToggleExpand,
  onSelectAllChildren,
  expandedIds,
  selectedIds,
  onToggleChapter,
  onToggleExpandChapter,
}: ChapterItemProps) {
  const hasChildren = chapter.children.length > 0
  const indentPx = chapter.depth * 24

  // Check if all children are selected
  const allChildrenIds = hasChildren ? getAllDescendantIds(chapter) : []
  const allChildrenSelected = hasChildren && allChildrenIds.every((id) => selectedIds.has(id))
  const someChildrenSelected = hasChildren && allChildrenIds.some((id) => selectedIds.has(id)) && !allChildrenSelected

  return (
    <div>
      <div
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2.5",
          "border border-transparent transition-all duration-150",
          "hover:border-primary/30 hover:bg-primary/5",
          isSelected && "border-primary/50 bg-primary/10",
        )}
        style={{ paddingLeft: `${12 + indentPx}px` }}
      >
        {/* Expand/Collapse button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-muted"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5 shrink-0" />
        )}

        {/* Parent selection checkbox */}
        <button
          onClick={onToggle}
          className="shrink-0"
          title="Select this chapter"
        >
          <SelectionIndicator isSelected={isSelected} />
        </button>

        {/* Select all children checkbox - only for chapters with children */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelectAllChildren(chapter)
            }}
            className="shrink-0"
            title={allChildrenSelected ? "Deselect all sub-chapters" : "Select all sub-chapters"}
          >
            <ChildrenSelectionIndicator 
              allSelected={allChildrenSelected} 
              someSelected={someChildrenSelected} 
            />
          </button>
        ) : null}

        {/* Chapter info */}
        <div className="flex-1 min-w-0">
          <ChapterInfo chapter={chapter} />
        </div>
      </div>

      {/* Render children if expanded */}
      {hasChildren && isExpanded && (
        <div className="ml-0">
          {chapter.children.map((child) => (
            <ChapterItem
              key={child.id}
              chapter={child}
              isSelected={selectedIds.has(child.id)}
              isExpanded={expandedIds.has(child.id)}
              onToggle={() => onToggleChapter(child.id)}
              onToggleExpand={() => onToggleExpandChapter(child.id)}
              onSelectAllChildren={onSelectAllChildren}
              expandedIds={expandedIds}
              selectedIds={selectedIds}
              onToggleChapter={onToggleChapter}
              onToggleExpandChapter={onToggleExpandChapter}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SelectionIndicator({ isSelected }: { isSelected: boolean }) {
  return (
    <div
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded",
        "border-2 transition-colors duration-150",
        isSelected ? "border-primary bg-primary" : "border-muted-foreground",
      )}
    >
      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
    </div>
  )
}

function ChildrenSelectionIndicator({ allSelected, someSelected }: { allSelected: boolean; someSelected: boolean }) {
  return (
    <div
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded",
        "border-2 transition-colors duration-150",
        allSelected 
          ? "border-cyan-500 bg-cyan-500" 
          : someSelected 
            ? "border-cyan-500 bg-cyan-500/30" 
            : "border-muted-foreground",
      )}
    >
      <Users className={cn(
        "h-3 w-3",
        allSelected ? "text-white" : someSelected ? "text-cyan-500" : "text-muted-foreground"
      )} />
    </div>
  )
}

function ChapterInfo({ chapter }: { chapter: EpubChapter }) {
  const hasChildren = chapter.children.length > 0
  
  return (
    <div className="min-w-0 flex-1 text-left">
      <p className="truncate font-medium text-foreground">{chapter.title}</p>
      <p className="text-xs text-muted-foreground">
        {hasChildren 
          ? `${chapter.children.length} sub-chapter${chapter.children.length > 1 ? 's' : ''}`
          : `Chapter ${chapter.order + 1}`
        }
      </p>
    </div>
  )
}
