import { describe, expect, it } from "vitest";
import {
  basename,
  createDocumentFromFile,
  createUntitledDocument,
  markDocumentSaved,
  updateDocumentContent
} from "./document";

describe("document helpers", () => {
  it("creates an untitled clean document", () => {
    const documentState = createUntitledDocument();

    expect(documentState.path).toBeNull();
    expect(documentState.dirty).toBe(false);
    expect(documentState.name).toBe("untitled.md");
  });

  it("builds a document from an opened file", () => {
    const documentState = createDocumentFromFile({
      path: "C:\\drafts\\story.md",
      content: "# Story"
    });

    expect(documentState.name).toBe("story.md");
    expect(documentState.dirty).toBe(false);
  });

  it("marks content updates as dirty and save as clean", () => {
    const dirtyDocument = updateDocumentContent(createUntitledDocument(), "# New");
    const cleanDocument = markDocumentSaved(dirtyDocument, "/tmp/note.md");

    expect(dirtyDocument.dirty).toBe(true);
    expect(cleanDocument.dirty).toBe(false);
    expect(cleanDocument.name).toBe("note.md");
  });

  it("handles both slash styles for basenames", () => {
    expect(basename("/tmp/note.md")).toBe("note.md");
    expect(basename("C:\\tmp\\note.md")).toBe("note.md");
  });
});
