import type React from "react"
import { BookOpen, User } from "lucide-react"
import type { EpubMetadata } from "@/lib/epub/types"

interface BookInfoProps {
  metadata: EpubMetadata
  fileName: string
}

/**
 * Displays loaded book information
 */
export function BookInfo({ metadata, fileName }: BookInfoProps) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      <div className="flex flex-col gap-2">
        <InfoRow icon={<BookOpen className="h-4 w-4" />} label="Title">
          {metadata.title}
        </InfoRow>
        <InfoRow icon={<User className="h-4 w-4" />} label="Author">
          {metadata.author}
        </InfoRow>
        <InfoRow label="File">{fileName}</InfoRow>
        <InfoRow label="Chapters">{metadata.chapterCount} total</InfoRow>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {icon && <span className="text-primary">{icon}</span>}
      <span className="font-mono text-muted-foreground">{label}:</span>
      <span className="truncate font-medium text-foreground">{children}</span>
    </div>
  )
}
