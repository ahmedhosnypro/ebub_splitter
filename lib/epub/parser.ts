import type { EpubChapter, EpubMetadata } from "./types"

/**
 * Parses XML string to Document
 * @param xml - XML string to parse
 * @returns Parsed XML Document
 */
export function parseXml(xml: string): Document {
  const parser = new DOMParser()
  return parser.parseFromString(xml, "application/xml")
}

/**
 * Extracts text content from XML element safely
 * @param element - Parent element
 * @param selector - CSS selector
 * @returns Text content or empty string
 */
export function getElementText(element: Element | Document, selector: string): string {
  const el = element.querySelector(selector)
  return el?.textContent?.trim() ?? ""
}

/**
 * Finds the root file path from container.xml
 * @param containerXml - container.xml content
 * @returns Path to content.opf
 */
export function findRootFilePath(containerXml: string): string {
  const doc = parseXml(containerXml)
  const rootFile = doc.querySelector("rootfile")
  return rootFile?.getAttribute("full-path") ?? "OEBPS/content.opf"
}

/**
 * Extracts metadata from OPF document
 * @param opfDoc - Parsed OPF document
 * @returns Extracted metadata
 */
export function extractMetadata(opfDoc: Document): Partial<EpubMetadata> {
  const title = getElementText(opfDoc, "metadata title, dc\\:title")
  const author = getElementText(opfDoc, "metadata creator, dc\\:creator")

  return { title: title || "Untitled", author: author || "Unknown Author" }
}

/**
 * Builds a map of spine items with their hrefs and IDs
 */
function buildSpineMap(opfDoc: Document): Map<string, { id: string; href: string; order: number }> {
  const map = new Map<string, { id: string; href: string; order: number }>()
  const manifest = opfDoc.querySelector("manifest")
  const spine = opfDoc.querySelector("spine")

  if (!manifest || !spine) return map

  const spineItems = spine.querySelectorAll("itemref")

  spineItems.forEach((itemRef, index) => {
    const idref = itemRef.getAttribute("idref")
    const manifestItem = manifest.querySelector(`item[id="${idref}"]`)

    if (manifestItem) {
      const href = manifestItem.getAttribute("href") ?? ""
      const baseHref = href.split("#")[0]
      map.set(baseHref, { id: idref ?? `item-${index}`, href: baseHref, order: index })
    }
  })

  return map
}

/**
 * Gets all spine hrefs in order
 */
function getSpineHrefs(opfDoc: Document): string[] {
  const hrefs: string[] = []
  const manifest = opfDoc.querySelector("manifest")
  const spine = opfDoc.querySelector("spine")

  if (!manifest || !spine) return hrefs

  const spineItems = spine.querySelectorAll("itemref")

  spineItems.forEach((itemRef) => {
    const idref = itemRef.getAttribute("idref")
    const manifestItem = manifest.querySelector(`item[id="${idref}"]`)
    if (manifestItem) {
      const href = manifestItem.getAttribute("href") ?? ""
      hrefs.push(href.split("#")[0])
    }
  })

  return hrefs
}

/**
 * Parses NCX navPoints to extract logical chapters with their content file ranges
 * @param opfDoc - Parsed OPF document
 * @param ncxDoc - Parsed NCX document (optional)
 * @returns Array of chapters with all associated content files
 */
export function extractChapters(opfDoc: Document, ncxDoc?: Document): EpubChapter[] {
  const chapters: EpubChapter[] = []
  const spineHrefs = getSpineHrefs(opfDoc)
  const spineMap = buildSpineMap(opfDoc)

  if (ncxDoc) {
    const navPoints = ncxDoc.querySelectorAll("navMap > navPoint")

    if (navPoints.length > 0) {
      return extractChaptersFromNavPoints(navPoints, spineHrefs, spineMap)
    }
  }

  return extractChaptersFromSpine(opfDoc)
}

/**
 * Extracts chapters based on NCX navPoints recursively
 */
function extractChaptersFromNavPoints(
  navPoints: NodeListOf<Element>,
  spineHrefs: string[],
  spineMap: Map<string, { id: string; href: string; order: number }>,
): EpubChapter[] {
  let globalOrder = 0

  function parseNavPoint(
    navPoint: Element,
    allNavPoints: Element[],
    currentIndex: number,
    depth: number,
    parentId?: string,
  ): EpubChapter | null {
    const content = navPoint.querySelector(":scope > content")
    const navLabel = navPoint.querySelector(":scope > navLabel text")
    const src = content?.getAttribute("src") ?? ""
    const baseHref = src.split("#")[0]
    const rawTitle = navLabel?.textContent?.trim() ?? `Chapter ${globalOrder + 1}`
    
    // Fix common UTF-8 mojibake patterns
    const title = rawTitle
      .replace(/â€¢/g, '•')  // Fix bullet point
      .replace(/â€"/g, '—')  // Fix em dash
      .replace(/â€"/g, '–')  // Fix en dash
      .replace(/â€™/g, "'")  // Fix right single quote
      .replace(/â€œ/g, '"')  // Fix left double quote
      .replace(/â€/g, '"')   // Fix right double quote
      .replace(/â€¦/g, '…')  // Fix ellipsis
      .trim()

    // Find the start index in spine
    const startIdx = spineHrefs.findIndex((h) => h === baseHref || h.endsWith(baseHref))
    if (startIdx === -1) return null

    let endIdx = spineHrefs.length - 1

    // Find next sibling navPoint at same level to determine content range
    if (currentIndex < allNavPoints.length - 1) {
      const nextNavPoint = allNavPoints[currentIndex + 1]
      const nextContent = nextNavPoint.querySelector(":scope > content")
      const nextSrc = nextContent?.getAttribute("src") ?? ""
      const nextBaseHref = nextSrc.split("#")[0]
      const nextStartIdx = spineHrefs.findIndex((h) => h === nextBaseHref || h.endsWith(nextBaseHref))

      if (nextStartIdx > startIdx) {
        endIdx = nextStartIdx - 1
      }
    }

    const contentHrefs = spineHrefs.slice(startIdx, endIdx + 1)
    const spineItem = spineMap.get(baseHref)
    const chapterId = spineItem?.id ?? `chapter-${globalOrder}`

    // Parse nested navPoints (children)
    const childNavPoints = navPoint.querySelectorAll(":scope > navPoint")
    const children: EpubChapter[] = []
    const childNavPointsArray = Array.from(childNavPoints)

    childNavPointsArray.forEach((childNavPoint, childIndex) => {
      const child = parseNavPoint(childNavPoint, childNavPointsArray, childIndex, depth + 1, chapterId)
      if (child) children.push(child)
    })

    const chapter: EpubChapter = {
      id: chapterId,
      title,
      href: baseHref,
      contentHrefs,
      order: globalOrder++,
      selected: false,
      depth,
      children,
      parentId,
    }

    return chapter
  }

  const chapters: EpubChapter[] = []
  const navPointsArray = Array.from(navPoints)

  navPointsArray.forEach((navPoint, index) => {
    const chapter = parseNavPoint(navPoint, navPointsArray, index, 0)
    if (chapter) chapters.push(chapter)
  })

  return chapters
}

/**
 * Fallback: extract chapters from spine items directly
 */
function extractChaptersFromSpine(opfDoc: Document): EpubChapter[] {
  const chapters: EpubChapter[] = []
  const manifest = opfDoc.querySelector("manifest")
  const spine = opfDoc.querySelector("spine")

  if (!manifest || !spine) return chapters

  const spineItems = spine.querySelectorAll("itemref")

  spineItems.forEach((itemRef, index) => {
    const idref = itemRef.getAttribute("idref")
    const manifestItem = manifest.querySelector(`item[id="${idref}"]`)

    if (!manifestItem) return

    const href = manifestItem.getAttribute("href") ?? ""

    chapters.push({
      id: idref ?? `chapter-${index}`,
      title: `Chapter ${index + 1}`,
      href,
      contentHrefs: [href],
      order: index,
      selected: false,
      depth: 0,
      children: [],
    })
  })

  return chapters
}
