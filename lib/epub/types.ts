/**
 * Represents a chapter/section in an EPUB file
 */
export interface EpubChapter {
  /** Unique identifier for the chapter */
  id: string
  /** Display title of the chapter */
  title: string
  /** Path to the primary chapter file within EPUB */
  href: string
  /** All content file paths belonging to this chapter */
  contentHrefs: string[]
  /** Order index in the spine */
  order: number
  /** Whether the chapter is selected for extraction */
  selected: boolean
  /** Nesting depth level (0 = root) */
  depth: number
  /** Nested sub-chapters */
  children: EpubChapter[]
  /** Parent chapter ID (if nested) */
  parentId?: string
}

/**
 * Calculates the maximum depth of nested chapters in a chapter tree
 */
export function getMaxDepth(chapters: EpubChapter[]): number {
  let maxDepth = 0
  for (const chapter of chapters) {
    maxDepth = Math.max(maxDepth, chapter.depth)
    if (chapter.children.length > 0) {
      maxDepth = Math.max(maxDepth, getMaxDepth(chapter.children))
    }
  }
  return maxDepth
}

/**
 * Flattens a chapter tree to a flat array up to a specified depth
 */
export function flattenChapters(chapters: EpubChapter[], maxDepth: number = Infinity): EpubChapter[] {
  const result: EpubChapter[] = []
  
  function traverse(items: EpubChapter[]) {
    for (const chapter of items) {
      result.push(chapter)
      if (chapter.children.length > 0 && chapter.depth < maxDepth) {
        traverse(chapter.children)
      }
    }
  }
  
  traverse(chapters)
  return result
}

/**
 * Parsed EPUB metadata
 */
export interface EpubMetadata {
  /** Book title */
  title: string
  /** Author name(s) */
  author: string
  /** Total chapter count */
  chapterCount: number
}

/**
 * Processing state for the worker
 */
export interface ProcessingState {
  /** Current processing status */
  status: "idle" | "parsing" | "extracting" | "zipping" | "complete" | "error"
  /** Current chapter being processed */
  currentChapter: number
  /** Total chapters to process */
  totalChapters: number
  /** Elapsed time in milliseconds */
  elapsedTime: number
  /** Estimated time remaining in milliseconds */
  estimatedRemaining: number
  /** Error message if status is 'error' */
  errorMessage?: string
}

/**
 * Message types for worker communication
 */
export type WorkerMessage =
  | { type: "parse"; file: ArrayBuffer }
  | { type: "extract"; selectedIds: string[] }
  | { type: "cancel" }

/**
 * Response types from worker
 */
export type WorkerResponse =
  | { type: "parsed"; chapters: EpubChapter[]; metadata: EpubMetadata }
  | { type: "progress"; state: ProcessingState }
  | { type: "complete"; blob: Blob }
  | { type: "error"; message: string }
