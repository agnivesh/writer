export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface DocumentState {
  path: string | null;
  name: string;
  content: string;
  dirty: boolean;
}

export interface OpenFilePayload {
  path: string;
  content: string;
}

export interface SaveFilePayload {
  path: string;
}

export type MenuAction =
  | "new-file"
  | "open-file"
  | "save-file"
  | "save-file-as";

export interface MenuActionPayload {
  action: MenuAction;
}

export interface EditorScrollState {
  top: number;
  height: number;
  clientHeight: number;
}
