# EPUB Chapter Extractor

A web-based tool to extract individual chapters from EPUB files. Upload an EPUB, select the chapters you want, and download them as separate EPUB files.

## Features

- **Chapter Selection**: Browse and select individual chapters from any EPUB file
- **Nested Chapter Support**: Full support for hierarchical chapter structures (parts, chapters, sub-chapters)
- **Expandable Tree View**: Expand/collapse nested chapters with visual hierarchy
- **Bulk Selection**: Select all sub-chapters of a parent with a single click
- **Flexible Output Options**:
  - **Hierarchical**: Preserves directory structure matching the book's chapter hierarchy
  - **Flatten**: All chapters in a single directory with numbered prefixes for proper sorting
- **Smart Numbering**: Zero-padded chapter numbers (01, 02... or 001, 002...) based on chapter count
- **Unique Metadata**: Each extracted chapter gets its own title and identifier, so e-readers recognize them as separate books
- **Single Chapter**: Downloads directly as `.epub`
- **Multiple Chapters**: Downloads as `.zip` containing individual EPUBs

## How It Works

1. **Upload**: Drag and drop or click to upload an EPUB file
2. **Browse**: View the chapter structure with expandable nested chapters
3. **Select**: 
   - Click the left checkbox to select a chapter
   - Click the right checkbox (on chapters with sub-chapters) to select all sub-chapters
4. **Configure**:
   - Use "Flatten" toggle to output all files in a flat structure
   - Expand/collapse all chapters with header buttons
5. **Extract**: Click "Extract" to process selected chapters
6. **Download**: Get your extracted chapters as EPUB or ZIP

## Output Naming

**Hierarchical mode:**
```
01_Part_1/
  01_Chapter_1_Introduction.epub
  02_Chapter_2_Getting_Started.epub
02_Part_2/
  01_Chapter_1_Advanced_Topics.epub
```

**Flatten mode:**
```
01_Part_1_01_Chapter_1_Introduction.epub
01_Part_1_02_Chapter_2_Getting_Started.epub
02_Part_2_01_Chapter_1_Advanced_Topics.epub
```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- fflate (ZIP compression)

## Development

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Type check
bun tsc --noEmit

# Build for production
bun run build
```

## License

MIT
