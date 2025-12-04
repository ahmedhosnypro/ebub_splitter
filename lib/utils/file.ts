import { unzip } from "fflate"

/**
 * Validates if a file is an EPUB
 * @param file - File to validate
 * @returns True if valid EPUB
 */
export function isValidEpub(file: File): boolean {
  const validTypes = ["application/epub+zip", "application/epub"]
  const hasValidType = validTypes.includes(file.type)
  const hasValidExtension = file.name.toLowerCase().endsWith(".epub")

  return hasValidType || hasValidExtension
}

/**
 * Generates a download filename for extracted EPUB or ZIP
 * @param originalName - Original file name
 * @param chapterCount - Number of chapters extracted
 * @param isSingleEpub - Whether output is a single EPUB
 * @returns Generated filename with correct extension
 */
export function generateExportFilename(originalName: string, chapterCount: number, isSingleEpub: boolean): string {
  const baseName = originalName.replace(/\.epub$/i, "")
  const timestamp = new Date().toISOString().slice(0, 10)

  const extension = isSingleEpub ? "epub" : "zip"
  const chapterLabel = chapterCount === 1 ? "chapter" : "chapters"

  return `${baseName}_${chapterCount}${chapterLabel}_${timestamp}.${extension}`
}

/**
 * Triggers download of a blob
 * @param blob - Blob to download
 * @param filename - Target filename
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

/**
 * Deeply validates an EPUB file by checking its internal structure
 * @param file - File to validate
 * @returns Promise resolving to validation result with error message if invalid
 */
export async function validateEpubStructure(file: File): Promise<{ valid: boolean; error?: string }> {
  try {
    const buffer = await file.arrayBuffer()
    const data = new Uint8Array(buffer)

    if (data[0] !== 0x50 || data[1] !== 0x4b) {
      return { valid: false, error: "File is not a valid ZIP archive" }
    }

    return new Promise((resolve) => {
      unzip(data, (err, unzipped) => {
        if (err) {
          resolve({ valid: false, error: "Failed to read EPUB archive" })
          return
        }

        if (!unzipped["mimetype"]) {
          resolve({ valid: false, error: "Missing mimetype file" })
          return
        }

        const mimeContent = new TextDecoder().decode(unzipped["mimetype"])
        if (!mimeContent.trim().includes("application/epub+zip")) {
          resolve({ valid: false, error: "Invalid mimetype content" })
          return
        }

        if (!unzipped["META-INF/container.xml"]) {
          resolve({ valid: false, error: "Missing container.xml" })
          return
        }

        const containerXml = new TextDecoder().decode(unzipped["META-INF/container.xml"])
        if (!containerXml.includes("rootfile")) {
          resolve({ valid: false, error: "Invalid container.xml structure" })
          return
        }

        resolve({ valid: true })
      })
    })
  } catch {
    return { valid: false, error: "Failed to read file" }
  }
}
