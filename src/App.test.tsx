import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const openMarkdownFile = vi.fn();
const saveMarkdownFile = vi.fn();
const saveMarkdownFileAs = vi.fn();
const readAppTheme = vi.fn();
const listenForMenuActions = vi.fn();
const close = vi.fn();
let closeHandler:
  | ((event: { preventDefault: () => void }) => Promise<void> | void)
  | undefined;

vi.mock("./components/EditorPane", () => ({
  default: ({
    onChange,
    value
  }: {
    onChange: (value: string) => void;
    value: string;
  }) => (
    <textarea
      aria-label="Markdown editor"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  )
}));

vi.mock("./lib/desktop", () => ({
  openMarkdownFile: (...args: unknown[]) => openMarkdownFile(...args),
  saveMarkdownFile: (...args: unknown[]) => saveMarkdownFile(...args),
  saveMarkdownFileAs: (...args: unknown[]) => saveMarkdownFileAs(...args),
  readAppTheme: (...args: unknown[]) => readAppTheme(...args),
  listenForMenuActions: (...args: unknown[]) => listenForMenuActions(...args),
  getDesktopWindow: () => ({
    close,
    onCloseRequested: async (
      handler: (event: { preventDefault: () => void }) => Promise<void> | void
    ) => {
      closeHandler = handler;
      return () => {
        closeHandler = undefined;
      };
    }
  })
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    closeHandler = undefined;
    readAppTheme.mockResolvedValue("light");
    openMarkdownFile.mockResolvedValue(null);
    saveMarkdownFile.mockResolvedValue({ path: "C:\\drafts\\note.md" });
    saveMarkdownFileAs.mockResolvedValue({ path: "C:\\drafts\\note.md" });
    listenForMenuActions.mockImplementation(async () => () => {});
    window.localStorage.clear();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("renders the starter document preview", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "untitled.md" })
    ).toBeInTheDocument();
    expect(screen.getByText("Live preview")).toBeInTheDocument();
  });

  it("marks the document dirty and saves with save as when it has no path", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText("Markdown editor"));
    await user.type(screen.getByLabelText("Markdown editor"), "# Fresh draft");

    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(saveMarkdownFileAs).toHaveBeenCalledWith("# Fresh draft");
    });

    expect(screen.getByText("All changes saved")).toBeInTheDocument();
    expect(screen.getByText("C:\\drafts\\note.md")).toBeInTheDocument();
  });

  it("handles keyboard shortcuts", async () => {
    render(<App />);

    fireEvent.keyDown(window, { ctrlKey: true, key: "s" });

    await waitFor(() => {
      expect(saveMarkdownFileAs).toHaveBeenCalledTimes(1);
    });
  });

  it("opens a file through menu events", async () => {
    let menuHandler: ((payload: { action: string }) => void) | undefined;
    listenForMenuActions.mockImplementation(
      async (handler: (payload: { action: string }) => void) => {
      menuHandler = handler;
      return () => {
        menuHandler = undefined;
      };
      }
    );
    openMarkdownFile.mockResolvedValue({
      path: "C:\\drafts\\opened.md",
      content: "# Opened"
    });

    render(<App />);

    await waitFor(() => {
      expect(menuHandler).toBeDefined();
    });

    menuHandler?.({ action: "open-file" });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "opened.md" })).toBeInTheDocument();
    });
  });

  it("prompts before discarding unsaved changes", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    render(<App />);

    await user.type(screen.getByLabelText("Markdown editor"), " update");
    await user.click(screen.getByRole("button", { name: "New" }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByDisplayValue(/update/)).toBeInTheDocument();
  });

  it("prompts before closing with unsaved changes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Markdown editor"), " updated");
    expect(closeHandler).toBeDefined();

    const preventDefault = vi.fn();
    await closeHandler?.({ preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
