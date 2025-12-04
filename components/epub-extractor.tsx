"use client"

import { useState } from "react"
import { useEpubWorker } from "@/hooks/use-epub-worker"
import { useChapterSelection } from "@/hooks/use-chapter-selection"
import { downloadBlob, generateExportFilename } from "@/lib/utils/file"
import { Dropzone } from "@/components/dropzone/dropzone"
import { ChapterList } from "@/components/chapter-list/chapter-list"
import { ProgressPanel } from "@/components/progress/progress-panel"
import { BookInfo } from "@/components/metadata/book-info"
import { ActionBar } from "@/components/actions/action-bar"
import { flattenChapters } from "@/lib/epub/types"

/**
 * Main EPUB extraction workflow component
 */
export function EpubExtractor() {
  const [fileName, setFileName] = useState("")
  const { chapters, metadata, processingState, extractionResult, parseFile, extractChapters, reset } = useEpubWorker()

  const selection = useChapterSelection(chapters)
  const isProcessing = ["parsing", "extracting", "zipping"].includes(processingState.status)

  // Get total chapter count including nested chapters up to extraction depth
  const visibleChapters = flattenChapters(chapters, selection.extractionDepth)
  const totalChapterCount = visibleChapters.length

  const handleFileDrop = (file: File) => {
    setFileName(file.name)
    parseFile(file)
  }

  const handleExtract = () => {
    extractChapters(Array.from(selection.selectedIds), selection.flattenOutput)
  }

  const handleDownload = () => {
    if (!extractionResult) return
    const exportName = generateExportFilename(fileName, extractionResult.chapterCount, extractionResult.isSingleEpub)
    downloadBlob(extractionResult.blob, exportName)
  }

  const handleReset = () => {
    reset()
    setFileName("")
    selection.deselectAll()
  }

  return (
    <div className="flex flex-col gap-6">
      {chapters.length === 0 && !isProcessing && <Dropzone onFileDrop={handleFileDrop} disabled={isProcessing} />}

      {metadata && <BookInfo metadata={metadata} fileName={fileName} />}

      {chapters.length > 0 && (
        <ChapterList
          chapters={chapters}
          selectedIds={selection.selectedIds}
          expandedIds={selection.expandedIds}
          onToggle={selection.toggleChapter}
          onToggleExpand={selection.toggleExpand}
          onToggleAllChildren={selection.toggleAllChildren}
          onSelectAll={selection.selectAll}
          onDeselectAll={selection.deselectAll}
          onExpandAll={selection.expandAll}
          onCollapseAll={selection.collapseAll}
          allSelected={selection.allSelected}
          someSelected={selection.someSelected}
          maxDepth={selection.maxDepth}
          extractionDepth={selection.extractionDepth}
          onExtractionDepthChange={selection.setExtractionDepth}
          flattenOutput={selection.flattenOutput}
          onToggleFlatten={selection.toggleFlatten}
        />
      )}

      {isProcessing && <ProgressPanel state={processingState} />}

      {chapters.length > 0 && (
        <ActionBar
          selectedCount={selection.selectedCount}
          isProcessing={isProcessing}
          canDownload={extractionResult !== null}
          onExtract={handleExtract}
          onDownload={handleDownload}
          onReset={handleReset}
          isSingleEpub={extractionResult?.isSingleEpub}
        />
      )}

      {processingState.status === "error" && <ErrorDisplay message={processingState.errorMessage} />}
    </div>
  )
}

function ErrorDisplay({ message }: { message?: string }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
      <p className="font-mono text-destructive">{message ?? "An error occurred"}</p>
    </div>
  )
}
