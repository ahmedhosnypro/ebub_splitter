import { ChevronsUpDown, ChevronsDownUp, FolderTree } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChapterListHeaderProps {
  totalCount: number
  selectedCount: number
  allSelected: boolean
  someSelected: boolean
  onToggleAll: () => void
  hasNestedChapters?: boolean
  onExpandAll?: () => void
  onCollapseAll?: () => void
  flattenOutput?: boolean
  onToggleFlatten?: () => void
}

/**
 * Chapter list header with select all control and expand/collapse buttons
 */
export function ChapterListHeader({
  totalCount,
  selectedCount,
  allSelected,
  someSelected,
  onToggleAll,
  hasNestedChapters,
  onExpandAll,
  onCollapseAll,
  flattenOutput,
  onToggleFlatten,
}: ChapterListHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <Checkbox checked={allSelected || (someSelected ? "indeterminate" : false)} onCheckedChange={onToggleAll} />
        <span className="font-mono text-sm text-muted-foreground">Select All</span>
        
        {/* Flatten toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFlatten}
          disabled={!hasNestedChapters}
          className={cn(
            "h-7 px-2 text-xs gap-1.5",
            flattenOutput && hasNestedChapters && "bg-primary/10 text-primary"
          )}
          title={flattenOutput ? "Flatten enabled - no subdirectories in ZIP" : "Flatten disabled - preserve directory hierarchy"}
        >
          <FolderTree className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Flatten</span>
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        {hasNestedChapters && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onExpandAll}
              className="h-7 px-2 text-xs"
              title="Expand all"
            >
              <ChevronsUpDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCollapseAll}
              className="h-7 px-2 text-xs"
              title="Collapse all"
            >
              <ChevronsDownUp className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
        <span className="font-mono text-sm text-primary ml-2">
          {selectedCount} / {totalCount}
        </span>
      </div>
    </div>
  )
}
