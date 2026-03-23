import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("renders GFM-style checklists and tables", () => {
    const html = renderMarkdown(`
- [x] done

| Name | Value |
| --- | --- |
| draft | ready |
`);

    expect(html).toContain('type="checkbox"');
    expect(html).toContain("<table>");
    expect(html).toContain("<td>ready</td>");
  });

  it("sanitizes raw script tags", () => {
    const html = renderMarkdown('<script>alert("xss")</script><p>safe</p>');

    expect(html).not.toContain("<script>");
    expect(html).toContain("<p>safe</p>");
  });
});
