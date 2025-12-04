"use client"

import { useCallback, useRef, useState } from "react"
import type { EpubChapter, EpubMetadata, ProcessingState } from "@/lib/epub/types"
import { EpubExtractor, type ExtractionResult } from "@/lib/epub/extractor"

interface UseEpubWorkerReturn {
  chapters: EpubChapter[]
  metadata: EpubMetadata | null
  processingState: ProcessingState
  extractionResult: ExtractionResult | null
  parseFile: (file: File) => Promise<void>
  extractChapters: (selectedIds: string[], flatten?: boolean) => void
  reset: () => void
}

const initialState: ProcessingState = {
  status: "idle",
  currentChapter: 0,
  totalChapters: 0,
  elapsedTime: 0,
  estimatedRemaining: 0,
}

/**
 * Hook for managing EPUB processing
 * Runs extraction directly (no web worker for v0 compatibility)
 */
export function useEpubWorker(): UseEpubWorkerReturn {
  const extractorRef = useRef<EpubExtractor | null>(null)
  const [chapters, setChapters] = useState<EpubChapter[]>([])
  const [metadata, setMetadata] = useState<EpubMetadata | null>(null)
  const [processingState, setProcessingState] = useState(initialState)
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null)

  /**
   * Parses an EPUB file and extracts chapter metadata
   */
  const parseFile = useCallback(async (file: File) => {
    setProcessingState({ ...initialState, status: "parsing" })

    try {
      extractorRef.current = new EpubExtractor()
      const buffer = await file.arrayBuffer()
      const result = await extractorRef.current.parse(buffer)

      setChapters(result.chapters)
      setMetadata(result.metadata)
      setProcessingState({ ...initialState, status: "idle" })
    } catch (error) {
      setProcessingState((s) => ({
        ...s,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Failed to parse EPUB",
      }))
    }
  }, [])

  /**
   * Extracts selected chapters into EPUB(s)
   */
  const extractChapters = useCallback(async (selectedIds: string[], flatten: boolean = false) => {
    if (!extractorRef.current) return

    setExtractionResult(null)
    setProcessingState((s) => ({ ...s, status: "extracting" }))

    try {
      const result = await extractorRef.current.extract(selectedIds, (state) => {
        setProcessingState(state)
      }, flatten)

      setExtractionResult(result)
      setProcessingState((s) => ({ ...s, status: "complete" }))
    } catch (error) {
      setProcessingState((s) => ({
        ...s,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Failed to extract chapters",
      }))
    }
  }, [])

  /**
   * Resets all state to initial values
   */
  const reset = useCallback(() => {
    extractorRef.current = null
    setChapters([])
    setMetadata(null)
    setProcessingState(initialState)
    setExtractionResult(null)
  }, [])

  return {
    chapters,
    metadata,
    processingState,
    extractionResult,
    parseFile,
    extractChapters,
    reset,
  }
}
