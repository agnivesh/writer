import type { MenuAction } from "../types";

export function getShortcutAction(
  event: Pick<
    KeyboardEvent,
    "key" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey"
  >
): MenuAction | null {
  if (event.altKey) {
    return null;
  }

  const primaryModifier = event.ctrlKey || event.metaKey;
  if (!primaryModifier) {
    return null;
  }

  switch (event.key.toLowerCase()) {
    case "n":
      return "new-file";
    case "o":
      return "open-file";
    case "s":
      return event.shiftKey ? "save-file-as" : "save-file";
    default:
      return null;
  }
}
