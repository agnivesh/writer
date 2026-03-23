import {
  startTransition,
  useDeferredValue,
  useEffect,
  useRef,
  useState
} from "react";
import { useEffectEvent } from "react";
import EditorPane from "./components/EditorPane";
import {
  createDocumentFromFile,
  createUntitledDocument,
  markDocumentSaved,
  THEME_STORAGE_KEY,
  updateDocumentContent
} from "./lib/document";
import {
  getDesktopWindow,
  listenForMenuActions,
  openMarkdownFile,
  readAppTheme,
  saveMarkdownFile,
  saveMarkdownFileAs
} from "./lib/desktop";
import { renderMarkdown } from "./lib/markdown";
import { syncPreviewScroll } from "./lib/preview";
import { getShortcutAction } from "./lib/shortcuts";
import type {
  DocumentState,
  EditorScrollState,
  MenuAction,
  MenuActionPayload,
  ResolvedTheme,
  ThemeMode
} from "./types";

function getInitialThemePreference(): ThemeMode {
  const persistedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (
    persistedTheme === "light" ||
    persistedTheme === "dark" ||
    persistedTheme === "system"
  ) {
    return persistedTheme;
  }

  return "system";
}

function nextTheme(theme: ThemeMode): ThemeMode {
  switch (theme) {
    case "light":
      return "dark";
    case "dark":
      return "system";
    default:
      return "light";
  }
}

export default function App() {
  const [documentState, setDocumentState] = useState<DocumentState>(() =>
    createUntitledDocument()
  );
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemePreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");
  const [statusMessage, setStatusMessage] = useState("Ready");
  const previewRef = useRef<HTMLElement | null>(null);
  const closeApprovedRef = useRef(false);

  const deferredContent = useDeferredValue(documentState.content);
  const previewHtml = renderMarkdown(deferredContent);
  const resolvedTheme = themeMode === "system" ? systemTheme : themeMode;

  const setThemePreference = useEffectEvent((nextPreference: ThemeMode) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    setThemeMode(nextPreference);
  });

  const confirmDiscardIfNeeded = useEffectEvent(() => {
    if (!documentState.dirty) {
      return true;
    }

    return window.confirm(
      "You have unsaved changes. Discard them and continue?"
    );
  });

  const saveDocumentAs = useEffectEvent(async () => {
    const savedFile = await saveMarkdownFileAs(documentState.content);
    if (!savedFile) {
      setStatusMessage("Save cancelled");
      return;
    }

    startTransition(() => {
      setDocumentState((currentState) =>
        markDocumentSaved(currentState, savedFile.path)
      );
    });
    setStatusMessage(`Saved ${savedFile.path}`);
  });

  const saveDocument = useEffectEvent(async () => {
    if (!documentState.path) {
      await saveDocumentAs();
      return;
    }

    const savedFile = await saveMarkdownFile(
      documentState.path,
      documentState.content
    );

    startTransition(() => {
      setDocumentState((currentState) =>
        markDocumentSaved(currentState, savedFile.path)
      );
    });
    setStatusMessage(`Saved ${savedFile.path}`);
  });

  const createNewDocument = useEffectEvent(async () => {
    if (!confirmDiscardIfNeeded()) {
      return;
    }

    startTransition(() => {
      setDocumentState(createUntitledDocument());
    });
    setStatusMessage("New document");
  });

  const openDocument = useEffectEvent(async () => {
    if (!confirmDiscardIfNeeded()) {
      return;
    }

    const openedFile = await openMarkdownFile();
    if (!openedFile) {
      setStatusMessage("Open cancelled");
      return;
    }

    startTransition(() => {
      setDocumentState(createDocumentFromFile(openedFile));
    });
    setStatusMessage(`Opened ${openedFile.path}`);
  });

  const dispatchAction = useEffectEvent(async (action: MenuAction) => {
    try {
      switch (action) {
        case "new-file":
          await createNewDocument();
          break;
        case "open-file":
          await openDocument();
          break;
        case "save-file":
          await saveDocument();
          break;
        case "save-file-as":
          await saveDocumentAs();
          break;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected desktop error";
      setStatusMessage(message);
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.title = `${documentState.dirty ? "• " : ""}${documentState.name} - Writer`;
  }, [documentState.dirty, documentState.name, resolvedTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateMediaTheme = (event: MediaQueryList | MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    updateMediaTheme(mediaQuery);
    mediaQuery.addEventListener("change", updateMediaTheme);

    return () => {
      mediaQuery.removeEventListener("change", updateMediaTheme);
    };
  }, []);

  useEffect(() => {
    void readAppTheme()
      .then((appTheme) => {
        if (appTheme === "light" || appTheme === "dark") {
          setSystemTheme(appTheme);
        }
      })
      .catch(() => {
        setStatusMessage("Using browser theme detection");
      });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const action = getShortcutAction(event);
      if (!action) {
        return;
      }

      event.preventDefault();
      void dispatchAction(action);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;

    void listenForMenuActions((payload: MenuActionPayload) => {
      void dispatchAction(payload.action);
    }).then((dispose) => {
      if (disposed) {
        dispose();
        return;
      }

      unlisten = dispose;
    });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;

    void getDesktopWindow()
      .onCloseRequested(async (event) => {
        if (closeApprovedRef.current) {
          closeApprovedRef.current = false;
          return;
        }

        if (!documentState.dirty) {
          return;
        }

        event.preventDefault();

        const shouldClose = window.confirm(
          "You have unsaved changes. Close the app anyway?"
        );
        if (!shouldClose) {
          return;
        }

        closeApprovedRef.current = true;
        await getDesktopWindow().close();
      })
      .then((dispose) => {
        if (disposed) {
          dispose();
          return;
        }

        unlisten = dispose;
      });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [documentState.dirty]);

  const handleEditorChange = useEffectEvent((value: string) => {
    setDocumentState((currentState) => updateDocumentContent(currentState, value));
    setStatusMessage("Editing");
  });

  const handleEditorScroll = useEffectEvent((scrollState: EditorScrollState) => {
    syncPreviewScroll(scrollState, previewRef.current);
  });

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="title-group">
          <p className="eyebrow">Markdown writer</p>
          <h1>{documentState.name}</h1>
          <p className="path-copy">
            {documentState.path ?? "Local scratch document"}
          </p>
        </div>

        <div className="toolbar">
          <div
            aria-live="polite"
            className={documentState.dirty ? "state-pill dirty" : "state-pill clean"}
          >
            {documentState.dirty ? "Unsaved changes" : "All changes saved"}
          </div>

          <div className="button-row">
            <button onClick={() => void createNewDocument()} type="button">
              New
            </button>
            <button onClick={() => void openDocument()} type="button">
              Open
            </button>
            <button onClick={() => void saveDocument()} type="button">
              Save
            </button>
            <button onClick={() => void saveDocumentAs()} type="button">
              Save As
            </button>
            <button
              className="theme-toggle"
              onClick={() => setThemePreference(nextTheme(themeMode))}
              type="button"
            >
              Theme: {themeMode}
            </button>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="panel editor-panel" aria-label="Markdown editor panel">
          <div className="panel-header">
            <span>Editor</span>
            <span>Markdown</span>
          </div>
          <EditorPane
            onChange={handleEditorChange}
            onScroll={handleEditorScroll}
            theme={resolvedTheme}
            value={documentState.content}
          />
        </section>

        <section className="panel preview-panel" aria-label="Rendered markdown preview">
          <div className="panel-header">
            <span>Preview</span>
            <span>Rendered</span>
          </div>
          <article
            className="preview-surface"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
            ref={previewRef}
          />
        </section>
      </main>

      <footer className="statusbar">
        <span>{statusMessage}</span>
        <span>Shortcuts: Ctrl/Cmd+N, O, S, Shift+S</span>
      </footer>
    </div>
  );
}
