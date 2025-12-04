import { Upload, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropzoneContentProps {
  isDragging: boolean
  isValidating?: boolean
}

/**
 * Content displayed inside dropzone
 */
export function DropzoneContent({ isDragging, isValidating }: DropzoneContentProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <div
        className={cn(
          "rounded-full bg-primary/10 p-4 transition-transform duration-200",
          isDragging && "scale-110",
          isValidating && "animate-pulse",
        )}
      >
        {isValidating ? (
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        ) : (
          <Upload className="h-8 w-8 text-primary" />
        )}
      </div>
      <div>
        <p className="font-mono text-lg font-semibold text-foreground">
          {isValidating ? "Validating EPUB..." : isDragging ? "Drop EPUB file here" : "Drag & drop your EPUB"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isValidating ? "Checking file structure" : "or click to browse files (.epub only)"}
        </p>
      </div>
    </div>
  )
}
