# Writer

Writer is a cross-platform Markdown desktop editor built with Rust, Tauri 2, React, and TypeScript. It provides a side-by-side writing surface with a live rendered preview, local file workflows, native menu integration, and light/dark/system theming.

## Features

- Side-by-side Markdown editor and rendered preview
- GitHub-style Markdown rendering with task lists, tables, and highlighted code blocks
- Local file workflow with `New`, `Open`, `Save`, and `Save As`
- Unsaved-change protection on document replacement and app close
- Native desktop menu actions routed into the frontend document workflow
- Cross-platform Tauri packaging for Windows, Linux, Intel macOS, and Apple Silicon

## Stack

- Rust + Tauri 2 for the desktop shell
- React 19 + TypeScript + Vite for the UI
- CodeMirror 6 for the editor
- `markdown-it` + `markdown-it-task-lists` + `highlight.js` + `dompurify` for rendering

## Local development

Install these first:

- Node.js 20+
- Rust 1.77.2+
- Tauri desktop prerequisites for your OS: [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

Run the app:

```bash
npm install
npm run tauri dev
```

Run tests:

```bash
npm install
npm run test:run
```

Build desktop bundles:

```bash
npm install
npm run tauri build
```

## Workspace layout

- `src/` contains the React application
- `src-tauri/` contains the Rust backend, Tauri config, and native menu wiring
- `.github/workflows/ci.yml` defines the cross-platform smoke-check workflow
