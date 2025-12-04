"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import { isValidEpub, validateEpubStructure } from "@/lib/utils/file"
import { NeonBorder } from "@/components/ui/neon-border"
import { DropzoneContent } from "./dropzone-content"

interface DropzoneProps {
  onFileDrop: (file: File) => void
  disabled?: boolean
}

/**
 * EPUB file dropzone with drag and drop support
 */
export function Dropzone({ onFileDrop, disabled }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) setIsDragging(true)
    },
    [disabled],
  )

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const processFile = useCallback(
    async (file: File) => {
      setError(null)

      // Quick extension/type check first
      if (!isValidEpub(file)) {
        setError("Please select a file with .epub extension")
        return
      }

      // Deep validation of EPUB structure
      setIsValidating(true)
      const result = await validateEpubStructure(file)
      setIsValidating(false)

      if (!result.valid) {
        setError(result.error ?? "Invalid EPUB file")
        return
      }

      onFileDrop(file)
    },
    [onFileDrop],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (disabled || isValidating) return
      const file = e.dataTransfer.files[0]
      processFile(file)
    },
    [disabled, isValidating, processFile],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  return (
    <NeonBorder className="w-full">
      <label
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center",
          "rounded-lg border-2 border-dashed border-border bg-card/50",
          "transition-colors duration-200",
          isDragging && "border-primary bg-primary/5",
          (disabled || isValidating) && "cursor-not-allowed opacity-50",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <DropzoneContent isDragging={isDragging} isValidating={isValidating} />
        <input
          type="file"
          accept=".epub"
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled || isValidating}
        />
        {error && <p className="pb-4 text-sm text-destructive">{error}</p>}
      </label>
    </NeonBorder>
  )
}
