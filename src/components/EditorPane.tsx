import { useEffect, useRef } from "react";
import { useEffectEvent } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { basicSetup } from "codemirror";
import type { EditorScrollState, ResolvedTheme } from "../types";

interface EditorPaneProps {
  value: string;
  theme: ResolvedTheme;
  onChange: (value: string) => void;
  onScroll: (scrollState: EditorScrollState) => void;
}

const lightTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "transparent",
    color: "var(--editor-foreground)"
  },
  ".cm-scroller": {
    fontFamily: '"IBM Plex Mono", "Fira Code", Consolas, monospace',
    fontSize: "0.96rem",
    lineHeight: "1.65"
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "var(--muted-foreground)",
    border: "none"
  },
  ".cm-content": {
    padding: "1.4rem 1.25rem 3rem"
  },
  ".cm-activeLine": {
    backgroundColor: "var(--editor-active-line)"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent"
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "var(--selection-color)"
  }
});

const darkTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "transparent",
      color: "var(--editor-foreground)"
    },
    ".cm-scroller": {
      fontFamily: '"IBM Plex Mono", "Fira Code", Consolas, monospace',
      fontSize: "0.96rem",
      lineHeight: "1.65"
    },
    ".cm-gutters": {
      backgroundColor: "transparent",
      color: "var(--muted-foreground)",
      border: "none"
    },
    ".cm-content": {
      padding: "1.4rem 1.25rem 3rem"
    },
    ".cm-activeLine": {
      backgroundColor: "var(--editor-active-line)"
    },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent"
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "var(--selection-color)"
    }
  },
  { dark: true }
);

function themeExtension(theme: ResolvedTheme) {
  return theme === "dark" ? [oneDark, darkTheme] : [lightTheme];
}

export default function EditorPane({
  value,
  theme,
  onChange,
  onScroll
}: EditorPaneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartmentRef = useRef<Compartment | null>(null);

  const handleChange = useEffectEvent(onChange);
  const handleScroll = useEffectEvent(onScroll);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const themeCompartment = new Compartment();
    themeCompartmentRef.current = themeCompartment;

    const editorView = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          markdown(),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              handleChange(update.state.doc.toString());
            }
          }),
          EditorView.domEventHandlers({
            scroll: (_, view) => {
              handleScroll({
                top: view.scrollDOM.scrollTop,
                height: view.scrollDOM.scrollHeight,
                clientHeight: view.scrollDOM.clientHeight
              });

              return false;
            }
          }),
          themeCompartment.of(themeExtension(theme))
        ]
      }),
      parent: containerRef.current
    });

    viewRef.current = editorView;

    return () => {
      viewRef.current = null;
      editorView.destroy();
    };
  }, []);

  useEffect(() => {
    const editorView = viewRef.current;
    if (!editorView) {
      return;
    }

    const currentValue = editorView.state.doc.toString();
    if (currentValue === value) {
      return;
    }

    editorView.dispatch({
      changes: {
        from: 0,
        to: currentValue.length,
        insert: value
      }
    });
  }, [value]);

  useEffect(() => {
    const editorView = viewRef.current;
    const themeCompartment = themeCompartmentRef.current;

    if (!editorView || !themeCompartment) {
      return;
    }

    editorView.dispatch({
      effects: themeCompartment.reconfigure(themeExtension(theme))
    });
  }, [theme]);

  return <div className="editor-pane" ref={containerRef} />;
}
