"use client"

import { Download, Trash2, Wand2 } from "lucide-react"
import { CyberButton } from "@/components/ui/cyber-button"

interface ActionBarProps {
  selectedCount: number
  isProcessing: boolean
  canDownload: boolean
  onExtract: () => void
  onDownload: () => void
  onReset: () => void
  isSingleEpub?: boolean
}

/**
 * Action buttons for extraction workflow
 */
export function ActionBar({
  selectedCount,
  isProcessing,
  canDownload,
  onExtract,
  onDownload,
  onReset,
  isSingleEpub,
}: ActionBarProps) {
  const downloadLabel = isSingleEpub ? "Download EPUB" : "Download ZIP"

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <CyberButton variant="primary" onClick={onExtract} disabled={selectedCount === 0 || isProcessing}>
        <Wand2 className="mr-2 h-4 w-4" />
        Extract {selectedCount > 0 && `(${selectedCount})`}
      </CyberButton>

      {canDownload && (
        <CyberButton variant="accent" onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" />
          {downloadLabel}
        </CyberButton>
      )}

      <CyberButton variant="secondary" onClick={onReset}>
        <Trash2 className="mr-2 h-4 w-4" />
        Reset
      </CyberButton>
    </div>
  )
}
