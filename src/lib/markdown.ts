import DOMPurify from "dompurify";
import hljs from "highlight.js";
import MarkdownIt from "markdown-it";
import markdownItTaskLists from "markdown-it-task-lists";

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(code, language) {
    const normalizedLanguage =
      language && hljs.getLanguage(language) ? language : "plaintext";
    const highlighted = hljs.highlight(code, {
      language: normalizedLanguage
    }).value;

    return `<pre class="hljs"><code>${highlighted}</code></pre>`;
  }
}).use(markdownItTaskLists, {
  enabled: true,
  label: true,
  labelAfter: true
});

export function renderMarkdown(content: string): string {
  const html = markdown.render(content);

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true }
  });
}
