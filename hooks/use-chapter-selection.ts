"use client"

import { useCallback, useMemo, useState } from "react"
import type { EpubChapter } from "@/lib/epub/types"
import { flattenChapters, getMaxDepth } from "@/lib/epub/types"

interface UseChapterSelectionReturn {
  selectedIds: Set<string>
  expandedIds: Set<string>
  toggleChapter: (id: string) => void
  toggleExpand: (id: string) => void
  toggleAllChildren: (chapter: EpubChapter) => void
  selectAll: () => void
  deselectAll: () => void
  expandAll: () => void
  collapseAll: () => void
  allSelected: boolean
  someSelected: boolean
  selectedCount: number
  maxDepth: number
  extractionDepth: number
  setExtractionDepth: (depth: number) => void
  flattenOutput: boolean
  toggleFlatten: () => void
}

/**
 * Gets all descendant IDs of a chapter
 */
function getDescendantIds(chapter: EpubChapter): string[] {
  const ids: string[] = []
  for (const child of chapter.children) {
    ids.push(child.id)
    ids.push(...getDescendantIds(child))
  }
  return ids
}

/**
 * Finds a chapter by ID in a tree
 */
function findChapter(chapters: EpubChapter[], id: string): EpubChapter | undefined {
  for (const chapter of chapters) {
    if (chapter.id === id) return chapter
    const found = findChapter(chapter.children, id)
    if (found) return found
  }
  return undefined
}

/**
 * Gets all chapter IDs that have children
 */
function getExpandableIds(chapters: EpubChapter[]): string[] {
  const ids: string[] = []
  for (const chapter of chapters) {
    if (chapter.children.length > 0) {
      ids.push(chapter.id)
      ids.push(...getExpandableIds(chapter.children))
    }
  }
  return ids
}

/**
 * Hook for managing chapter selection state with hierarchy support
 */
export function useChapterSelection(chapters: EpubChapter[]): UseChapterSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [extractionDepth, setExtractionDepth] = useState<number>(0)
  const [flattenOutput, setFlattenOutput] = useState<boolean>(false)

  const maxDepth = useMemo(() => getMaxDepth(chapters), [chapters])
  const allChapterIds = useMemo(() => flattenChapters(chapters).map((c) => c.id), [chapters])

  const toggleChapter = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleAllChildren = useCallback((chapter: EpubChapter) => {
    const childIds = getDescendantIds(chapter)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allSelected = childIds.every((id) => next.has(id))
      
      if (allSelected) {
        // Deselect all children
        childIds.forEach((id) => next.delete(id))
      } else {
        // Select all children
        childIds.forEach((id) => next.add(id))
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allChapterIds))
  }, [allChapterIds])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(getExpandableIds(chapters)))
  }, [chapters])

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  const toggleFlatten = useCallback(() => {
    setFlattenOutput((prev) => !prev)
  }, [])

  const allSelected = useMemo(
    () => allChapterIds.length > 0 && selectedIds.size === allChapterIds.length,
    [allChapterIds.length, selectedIds.size],
  )

  const someSelected = useMemo(
    () => selectedIds.size > 0 && selectedIds.size < allChapterIds.length,
    [selectedIds.size, allChapterIds.length],
  )

  return {
    selectedIds,
    expandedIds,
    toggleChapter,
    toggleExpand,
    toggleAllChildren,
    selectAll,
    deselectAll,
    expandAll,
    collapseAll,
    allSelected,
    someSelected,
    selectedCount: selectedIds.size,
    maxDepth,
    extractionDepth,
    setExtractionDepth,
    flattenOutput,
    toggleFlatten,
  }
}
