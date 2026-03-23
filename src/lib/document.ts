import type { DocumentState, OpenFilePayload } from "../types";

export const UNTITLED_NAME = "untitled.md";
export const THEME_STORAGE_KEY = "writer.theme";

export const STARTER_MARKDOWN = `# Writer

Start drafting on the left and watch the preview update on the right.

## Checklist

- [x] Live preview
- [x] Side-by-side layout
- [ ] Publish your final draft

## Table

| Section | Notes |
| --- | --- |
| Lead | Capture the central idea quickly |
| Body | Expand with evidence and structure |
| Close | End with a decisive takeaway |

## Code

\`\`\`rust
fn main() {
    println!("Write once, preview instantly.");
}
\`\`\`
`;

export function createUntitledDocument(): DocumentState {
  return {
    path: null,
    name: UNTITLED_NAME,
    content: STARTER_MARKDOWN,
    dirty: false
  };
}

export function createDocumentFromFile(file: OpenFilePayload): DocumentState {
  return {
    path: file.path,
    name: basename(file.path),
    content: file.content,
    dirty: false
  };
}

export function markDocumentSaved(
  documentState: DocumentState,
  path: string
): DocumentState {
  return {
    ...documentState,
    path,
    name: basename(path),
    dirty: false
  };
}

export function updateDocumentContent(
  documentState: DocumentState,
  nextContent: string
): DocumentState {
  if (documentState.content === nextContent) {
    return documentState;
  }

  return {
    ...documentState,
    content: nextContent,
    dirty: true
  };
}

export function basename(path: string): string {
  return path.split(/[/\\]/).pop() || UNTITLED_NAME;
}
