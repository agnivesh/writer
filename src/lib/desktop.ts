import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type {
  MenuActionPayload,
  OpenFilePayload,
  SaveFilePayload,
  ThemeMode
} from "../types";

export async function openMarkdownFile(): Promise<OpenFilePayload | null> {
  return invoke<OpenFilePayload | null>("open_markdown_file");
}

export async function saveMarkdownFile(
  path: string,
  content: string
): Promise<SaveFilePayload> {
  return invoke<SaveFilePayload>("save_markdown_file", { path, content });
}

export async function saveMarkdownFileAs(
  content: string
): Promise<SaveFilePayload | null> {
  return invoke<SaveFilePayload | null>("save_markdown_file_as", { content });
}

export async function readAppTheme(): Promise<ThemeMode> {
  return invoke<ThemeMode>("read_app_theme");
}

export function listenForMenuActions(
  handler: (payload: MenuActionPayload) => void
) {
  return listen<MenuActionPayload>("menu-action", (event) => {
    handler(event.payload);
  });
}

export function getDesktopWindow() {
  return getCurrentWebviewWindow();
}
