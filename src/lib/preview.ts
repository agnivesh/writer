import type { EditorScrollState } from "../types";

export function syncPreviewScroll(
  scrollState: EditorScrollState,
  previewElement: HTMLElement | null
) {
  if (!previewElement) {
    return;
  }

  const sourceScrollable = scrollState.height - scrollState.clientHeight;
  const targetScrollable =
    previewElement.scrollHeight - previewElement.clientHeight;

  if (sourceScrollable <= 0 || targetScrollable <= 0) {
    previewElement.scrollTop = 0;
    return;
  }

  const progress = scrollState.top / sourceScrollable;
  previewElement.scrollTop = progress * targetScrollable;
}
