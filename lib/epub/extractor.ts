import { unzip, zip, strToU8, strFromU8 } from "fflate"
import type { EpubChapter, EpubMetadata, ProcessingState } from "./types"
import { flattenChapters } from "./types"
import { parseXml, findRootFilePath, extractMetadata, extractChapters } from "./parser"

type ProgressCallback = (state: ProcessingState) => void

/**
 * Result of chapter extraction
 */
export interface ExtractionResult {
  /** The blob to download (single EPUB or ZIP of multiple EPUBs) */
  blob: Blob
  /** Whether the result is a single EPUB or a ZIP */
  isSingleEpub: boolean
  /** Number of chapters extracted */
  chapterCount: number
}

/**
 * Chapter with extraction path info
 */
interface ChapterWithPath {
  chapter: EpubChapter
  /** Path in the ZIP file (e.g., "Chapter_1/SubChapter_1.epub") */
  zipPath: string
  /** Whether this chapter has children that are also selected */
  hasSelectedChildren: boolean
}

/**
 * Manages EPUB file extraction and processing
 */
export class EpubExtractor {
  private files: Record<string, Uint8Array> = {}
  private rootPath = ""
  private basePath = ""
  private chapters: EpubChapter[] = []
  private metadata: EpubMetadata = { title: "", author: "", chapterCount: 0 }
  private startTime = 0
  private coverImagePath: string | null = null

  /**
   * Parses an EPUB file and extracts chapter information
   */
  async parse(buffer: ArrayBuffer): Promise<{ chapters: EpubChapter[]; metadata: EpubMetadata }> {
    this.files = await this.unzipBuffer(buffer)
    this.rootPath = this.findRootPath()
    this.basePath = this.rootPath.substring(0, this.rootPath.lastIndexOf("/") + 1)

    const opfContent = this.readFile(this.rootPath)
    const opfDoc = parseXml(opfContent)
    const ncxDoc = this.findAndParseNcx(opfDoc)

    this.metadata = {
      ...extractMetadata(opfDoc),
      chapterCount: 0,
    } as EpubMetadata

    this.chapters = extractChapters(opfDoc, ncxDoc)
    this.metadata.chapterCount = this.chapters.length
    
    // Extract cover image path
    this.coverImagePath = this.findCoverImage(opfDoc)

    return { chapters: this.chapters, metadata: this.metadata }
  }

  /**
   * Extracts selected chapters - single EPUB if one chapter, ZIP if multiple
   * Supports nested chapters with subdirectories in ZIP
   * @param flatten - If true, all EPUBs are placed in root of ZIP without subdirectories
   */
  async extract(selectedIds: string[], onProgress: ProgressCallback, flatten: boolean = false): Promise<ExtractionResult> {
    this.startTime = Date.now()
    const selectedSet = new Set(selectedIds)
    const chaptersWithPaths = this.buildChapterPaths(this.chapters, selectedSet, "", flatten)
    const total = chaptersWithPaths.length

    if (total === 1 && !chaptersWithPaths[0].hasSelectedChildren) {
      return this.extractSingleChapter(chaptersWithPaths[0], onProgress)
    }

    return this.extractMultipleChaptersWithHierarchy(chaptersWithPaths, onProgress)
  }

  /**
   * Calculates the number of digits needed for zero-padding based on count
   */
  private getZeroPadding(count: number): number {
    if (count < 10) return 1
    if (count < 100) return 2
    if (count < 1000) return 3
    return 4
  }

  /**
   * Formats a number with zero-padding
   */
  private formatNumber(num: number, padding: number): string {
    return num.toString().padStart(padding, "0")
  }

  /**
   * Builds chapter paths for ZIP structure, preserving full hierarchy
   * Even if parent chapters aren't selected, their folder structure is preserved
   * @param flatten - If true, all files go to root with numbered prefix (no subdirectories)
   */
  private buildChapterPaths(
    chapters: EpubChapter[],
    selectedIds: Set<string>,
    parentPath: string,
    flatten: boolean = false,
    parentNumberPrefix: string = "",
  ): ChapterWithPath[] {
    const result: ChapterWithPath[] = []
    const siblingCount = chapters.length
    const padding = this.getZeroPadding(siblingCount)

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i]
      const isSelected = selectedIds.has(chapter.id)
      const hasSelectedDescendants = this.hasSelectedDescendant(chapter, selectedIds)
      
      // Create numbered prefix for this level (1-indexed)
      const currentNumber = this.formatNumber(i + 1, padding)
      const numberPrefix = parentNumberPrefix ? `${parentNumberPrefix}_${currentNumber}` : currentNumber
      
      const safeName = this.sanitizeFilename(chapter.title, i + 1)
      
      let zipPath: string
      if (flatten) {
        // Flattened: use numbered prefix with underscores: 01_ParentName_02_ChildName
        zipPath = `${numberPrefix}_${safeName}`
      } else {
        // Hierarchical: use directory structure with numbers
        const numberedName = `${currentNumber}_${safeName}`
        zipPath = parentPath ? `${parentPath}/${numberedName}` : numberedName
      }

      // Add this chapter if it's selected
      if (isSelected) {
        result.push({
          chapter,
          zipPath,
          hasSelectedChildren: chapter.children.some((c) => this.hasSelectedDescendant(c, selectedIds)),
        })
      }

      // Always traverse children if any descendants are selected
      if (hasSelectedDescendants && chapter.children.length > 0) {
        const childParentPath = flatten ? "" : zipPath
        const childPaths = this.buildChapterPaths(
          chapter.children,
          selectedIds,
          childParentPath,
          flatten,
          flatten ? numberPrefix : "", // Only pass number prefix when flattening
        )
        result.push(...childPaths)
      }
    }

    return result
  }

  /**
   * Checks if a chapter or any of its descendants is selected
   */
  private hasSelectedDescendant(chapter: EpubChapter, selectedIds: Set<string>): boolean {
    if (selectedIds.has(chapter.id)) return true
    return chapter.children.some((c) => this.hasSelectedDescendant(c, selectedIds))
  }

  /**
   * Extracts a single chapter as an EPUB file
   */
  private async extractSingleChapter(chapterWithPath: ChapterWithPath, onProgress: ProgressCallback): Promise<ExtractionResult> {
    const { chapter, zipPath } = chapterWithPath
    const newFiles: Record<string, Uint8Array> = {}
    this.copyBaseFiles(newFiles)
    this.copyAllChapterFiles(chapter, newFiles)

    this.reportProgress(onProgress, "extracting", 1, 1)

    // Build metadata title: 01_02_BookTitle/Chapter Title/Sub Title
    const { numberPrefix, titlePath } = this.buildMetadataTitle(zipPath)
    const newTitle = `${numberPrefix}_${this.metadata.title}/${titlePath}`
      .replace(new RegExp(`/${this.metadata.title}/`, "g"), "/") // Remove duplicate book title
    this.updateOpfFile(newFiles, [chapter], newTitle)
    this.updateNcxFile(newFiles, [chapter])

    this.reportProgress(onProgress, "zipping", 1, 1)
    const blob = await this.createEpub(newFiles)

    return { blob, isSingleEpub: true, chapterCount: 1 }
  }

  /**
   * Extracts multiple chapters as separate EPUBs in a ZIP (legacy, flat structure)
   */
  private async extractMultipleChapters(
    chapters: EpubChapter[],
    onProgress: ProgressCallback,
  ): Promise<ExtractionResult> {
    const total = chapters.length
    const epubBlobs: Array<{ name: string; data: Uint8Array }> = []

    for (let i = 0; i < total; i++) {
      const chapter = chapters[i]
      const chapterFiles: Record<string, Uint8Array> = {}

      this.copyBaseFiles(chapterFiles)
      this.copyAllChapterFiles(chapter, chapterFiles)
      this.updateOpfFile(chapterFiles, [chapter])
      this.updateNcxFile(chapterFiles, [chapter])

      const epubData = await this.createEpubData(chapterFiles)
      const safeName = this.sanitizeFilename(chapter.title, i + 1)
      epubBlobs.push({ name: `${safeName}.epub`, data: epubData })

      this.reportProgress(onProgress, "extracting", i + 1, total)
    }

    this.reportProgress(onProgress, "zipping", total, total)
    const zipBlob = await this.createZipFromEpubs(epubBlobs)

    return { blob: zipBlob, isSingleEpub: false, chapterCount: total }
  }

  /**
   * Extracts chapters with hierarchical ZIP structure (subdirectories for nested chapters)
   */
  private async extractMultipleChaptersWithHierarchy(
    chaptersWithPaths: ChapterWithPath[],
    onProgress: ProgressCallback,
  ): Promise<ExtractionResult> {
    const total = chaptersWithPaths.length
    const epubBlobs: Array<{ name: string; data: Uint8Array }> = []

    for (let i = 0; i < total; i++) {
      const { chapter, zipPath } = chaptersWithPaths[i]
      const chapterFiles: Record<string, Uint8Array> = {}

      this.copyBaseFiles(chapterFiles)
      this.copyAllChapterFiles(chapter, chapterFiles)
      
      // Build metadata title: 01_02_BookTitle/Chapter Title/Sub Title
      const { numberPrefix, titlePath } = this.buildMetadataTitle(zipPath)
      const newTitle = `${numberPrefix}_${this.metadata.title}/${titlePath}`
        .replace(new RegExp(`/${this.metadata.title}/`, "g"), "/") // Remove duplicate book title
      this.updateOpfFile(chapterFiles, [chapter], newTitle)
      this.updateNcxFile(chapterFiles, [chapter])

      const epubData = await this.createEpubData(chapterFiles)
      epubBlobs.push({ name: `${zipPath}.epub`, data: epubData })

      this.reportProgress(onProgress, "extracting", i + 1, total)
    }

    this.reportProgress(onProgress, "zipping", total, total)
    const zipBlob = await this.createZipFromEpubs(epubBlobs)

    return { blob: zipBlob, isSingleEpub: false, chapterCount: total }
  }

  /**
   * Creates a readable title from a zip path
   * Converts "01_Part_1/02_•_Chapter_2_•_Title" to "Part 1 - Chapter 2 Title"
   */
  private createReadableTitle(zipPath: string): string {
    return zipPath
      .split("/")
      .map((part) => {
        return part
          // Remove leading number prefix (e.g., "01_" or "01_02_")
          .replace(/^(\d+_)+/, "")
          // Remove bullet points and clean up
          .replace(/•/g, "")
          .replace(/_+/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      })
      .filter((part) => part.length > 0)
      .join(" - ")
  }

  /**
   * Cleans chapter title for metadata (removes bullets, extra spaces)
   */
  private cleanChapterTitle(title: string): string {
    return title
      .replace(/•/g, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  /**
   * Builds metadata title from zipPath
   * Input: "01_Part_1/02_Chapter_1_Mr_Sherlock_Holmes" 
   * Output: { numberPrefix: "01_02", titlePath: "Part 1/Chapter 1 Mr Sherlock Holmes" }
   */
  private buildMetadataTitle(zipPath: string): { numberPrefix: string; titlePath: string } {
    const parts = zipPath.split("/")
    const numbers: number[] = []
    const titles: string[] = []

    for (const part of parts) {
      // Extract leading number (e.g., "01" from "01_Part_1")
      const match = part.match(/^(\d+)_(.+)$/)
      if (match) {
        numbers.push(parseInt(match[1], 10))
        // Clean the title part: replace underscores with spaces, clean bullets
        const cleanedTitle = match[2]
          .replace(/•/g, "")
          .replace(/_/g, " ")
          .replace(/\s+/g, " ")
          .trim()
        titles.push(cleanedTitle)
      } else {
        // No number prefix, just clean the title
        const cleanedTitle = part
          .replace(/•/g, "")
          .replace(/_/g, " ")
          .replace(/\s+/g, " ")
          .trim()
        titles.push(cleanedTitle)
      }
    }

    // Format numbers with consistent 2-digit padding
    const formattedNumbers = numbers.map((n) => n.toString().padStart(2, "0"))

    return {
      numberPrefix: formattedNumbers.join("_"),
      titlePath: titles.join("/"),
    }
  }

  /**
   * Creates a sanitized filename from chapter title
   */
  private sanitizeFilename(title: string, index: number): string {
    const cleaned = title
      .replace(/•/g, "")              // Remove bullet points
      .replace(/[<>:"/\\|?*]/g, "")   // Remove invalid filename chars
      .replace(/\s+/g, "_")           // Spaces to underscores
      .replace(/_+/g, "_")            // Collapse multiple underscores
      .replace(/^_|_$/g, "")          // Trim leading/trailing underscores
      .substring(0, 50)
      .trim()

    return cleaned || `chapter_${index.toString().padStart(2, "0")}`
  }

  /**
   * Creates an EPUB blob from files
   */
  private createEpub(files: Record<string, Uint8Array>): Promise<Blob> {
    return new Promise((resolve, reject) => {
      zip(files, { level: 6 }, (err, data) => {
        if (err) reject(err)
        else resolve(new Blob([data as BlobPart], { type: "application/epub+zip" }))
      })
    })
  }

  /**
   * Creates EPUB data as Uint8Array
   */
  private createEpubData(files: Record<string, Uint8Array>): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      zip(files, { level: 6 }, (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
  }

  /**
   * Creates a ZIP file containing multiple EPUBs
   */
  private createZipFromEpubs(epubs: Array<{ name: string; data: Uint8Array }>): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const zipFiles: Record<string, Uint8Array> = {}
      epubs.forEach(({ name, data }) => {
        zipFiles[name] = data
      })

      zip(zipFiles, { level: 6 }, (err, data) => {
        if (err) reject(err)
        else resolve(new Blob([data as BlobPart], { type: "application/zip" }))
      })
    })
  }

  private async unzipBuffer(buffer: ArrayBuffer): Promise<Record<string, Uint8Array>> {
    return new Promise((resolve, reject) => {
      unzip(new Uint8Array(buffer), (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
  }

  private findRootPath(): string {
    const container = this.readFile("META-INF/container.xml")
    return findRootFilePath(container)
  }

  private readFile(path: string): string {
    const file = this.files[path]
    if (!file) return ""
    return strFromU8(file)
  }

  private findAndParseNcx(opfDoc: Document): Document | undefined {
    const ncxItem = opfDoc.querySelector('item[media-type*="ncx"]')
    if (!ncxItem) return undefined

    const ncxPath = this.basePath + ncxItem.getAttribute("href")
    const ncxContent = this.readFile(ncxPath)
    return ncxContent ? parseXml(ncxContent) : undefined
  }

  /**
   * Finds the cover image in the EPUB
   * Checks multiple common patterns used by EPUB publishers
   */
  private findCoverImage(opfDoc: Document): string | null {
    // Method 1: Look for meta tag with name="cover"
    const coverMeta = opfDoc.querySelector('meta[name="cover"]')
    if (coverMeta) {
      const coverId = coverMeta.getAttribute("content")
      if (coverId) {
        const coverItem = opfDoc.querySelector(`item[id="${coverId}"]`)
        const href = coverItem?.getAttribute("href")
        if (href) return href
      }
    }

    // Method 2: Look for item with properties="cover-image"
    const coverItem = opfDoc.querySelector('item[properties="cover-image"]')
    if (coverItem) {
      const href = coverItem.getAttribute("href")
      if (href) return href
    }

    // Method 3: Look for item with id containing "cover"
    const manifest = opfDoc.querySelector("manifest")
    if (manifest) {
      const items = manifest.querySelectorAll("item")
      for (const item of Array.from(items)) {
        const id = item.getAttribute("id")?.toLowerCase() || ""
        const href = item.getAttribute("href")?.toLowerCase() || ""
        const mediaType = item.getAttribute("media-type") || ""
        
        if (mediaType.startsWith("image/") && (id.includes("cover") || href.includes("cover"))) {
          return item.getAttribute("href")
        }
      }
    }

    return null
  }

  private copyBaseFiles(newFiles: Record<string, Uint8Array>): void {
    const basePaths = ["mimetype", "META-INF/container.xml"]
    basePaths.forEach((path) => {
      if (this.files[path]) newFiles[path] = this.files[path]
    })

    Object.keys(this.files).forEach((path) => {
      if (path.match(/\.(css|ttf|otf|woff2?)$/i)) {
        newFiles[path] = this.files[path]
      }
    })
    
    // Copy cover image if it exists
    if (this.coverImagePath) {
      const coverPath = this.basePath + this.coverImagePath
      if (this.files[coverPath]) {
        newFiles[coverPath] = this.files[coverPath]
      }
    }
  }

  /**
   * Copies ALL content files belonging to a chapter
   */
  private copyAllChapterFiles(chapter: EpubChapter, newFiles: Record<string, Uint8Array>): void {
    const contentHrefs = chapter.contentHrefs || [chapter.href]

    for (const href of contentHrefs) {
      const filePath = this.basePath + href
      if (this.files[filePath]) {
        newFiles[filePath] = this.files[filePath]

        // Copy images referenced in this content file
        const content = this.readFile(filePath)
        this.copyReferencedAssets(content, newFiles)
      }
    }
  }

  /**
   * Copies all referenced assets (images, media) from content
   */
  private copyReferencedAssets(content: string, newFiles: Record<string, Uint8Array>): void {
    // Match src and href attributes for various asset types
    const assetRegex = /(?:src|href)=["']([^"']+\.(jpg|jpeg|png|gif|svg|webp|mp3|mp4|ogg))["']/gi
    let match

    while ((match = assetRegex.exec(content)) !== null) {
      let assetPath = match[1]

      // Handle relative paths
      if (!assetPath.startsWith("/")) {
        assetPath = this.basePath + assetPath
      }

      // Normalize path (handle ../)
      assetPath = this.normalizePath(assetPath)

      if (this.files[assetPath]) {
        newFiles[assetPath] = this.files[assetPath]
      }
    }
  }

  /**
   * Normalizes file path by resolving ../ and ./
   */
  private normalizePath(path: string): string {
    const parts = path.split("/")
    const result: string[] = []

    for (const part of parts) {
      if (part === "..") {
        result.pop()
      } else if (part !== "." && part !== "") {
        result.push(part)
      }
    }

    return result.join("/")
  }

  /**
   * Updates OPF file to include only selected chapter content files and update metadata
   */
  private updateOpfFile(newFiles: Record<string, Uint8Array>, chapters: EpubChapter[], newTitle?: string): void {
    const opfContent = this.readFile(this.rootPath)
    const doc = parseXml(opfContent)

    // Update metadata title if provided
    if (newTitle) {
      this.updateMetadataTitle(doc, newTitle)
    }

    // Collect all content hrefs from selected chapters
    const selectedHrefs = new Set<string>()
    chapters.forEach((c) => {
      const hrefs = c.contentHrefs || [c.href]
      hrefs.forEach((h) => selectedHrefs.add(h))
    })

    // Update spine to only include selected content
    const spine = doc.querySelector("spine")
    if (spine) {
      const manifest = doc.querySelector("manifest")
      const allItemRefs = spine.querySelectorAll("itemref")

      allItemRefs.forEach((itemRef) => {
        const idref = itemRef.getAttribute("idref")
        if (idref && manifest) {
          const manifestItem = manifest.querySelector(`item[id="${idref}"]`)
          const href = manifestItem?.getAttribute("href")

          if (href && !selectedHrefs.has(href)) {
            itemRef.remove()
          }
        }
      })
    }

    const serializer = new XMLSerializer()
    newFiles[this.rootPath] = strToU8(serializer.serializeToString(doc))
  }

  /**
   * Updates the title in OPF metadata
   */
  private updateMetadataTitle(doc: Document, newTitle: string): void {
    // Try dc:title first (most common)
    const dcTitle = doc.querySelector("metadata title, dc\\:title")
    if (dcTitle) {
      dcTitle.textContent = newTitle
    }

    // Also update the unique identifier if it exists
    const dcIdentifier = doc.querySelector("metadata identifier, dc\\:identifier")
    if (dcIdentifier) {
      // Generate a new unique identifier based on the title
      const uniqueId = `extracted-${Date.now()}-${newTitle.replace(/[^a-zA-Z0-9]/g, "").substring(0, 20)}`
      dcIdentifier.textContent = uniqueId
    }
  }

  private updateNcxFile(newFiles: Record<string, Uint8Array>, _chapters: EpubChapter[]): void {
    const opfDoc = parseXml(this.readFile(this.rootPath))
    const ncxItem = opfDoc.querySelector('item[media-type*="ncx"]')
    if (!ncxItem) return

    const ncxPath = this.basePath + ncxItem.getAttribute("href")
    if (this.files[ncxPath]) {
      newFiles[ncxPath] = this.files[ncxPath]
    }
  }

  private reportProgress(
    cb: ProgressCallback,
    status: ProcessingState["status"],
    current: number,
    total: number,
  ): void {
    const elapsed = Date.now() - this.startTime
    const avgTime = current > 0 ? elapsed / current : 0
    const remaining = Math.round(avgTime * (total - current))

    cb({
      status,
      currentChapter: current,
      totalChapters: total,
      elapsedTime: elapsed,
      estimatedRemaining: remaining,
    })
  }
}
