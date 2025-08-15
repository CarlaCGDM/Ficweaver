import type { ChapterNode, NodeData } from "../../../../context/storyStore/types";

/** Minimal, local type to avoid circular imports with ChapterBlock */
export type ChapterLikeForCopy = {
  id: string;
  chapterNode: ChapterNode;
  scenes: Array<{
    id: string;
    title?: string;
    description?: string;
    nodes: NodeData[]; // text + media mixed
  }>;
};

/** Strip HTML to plain text (fallback copy content) */
export function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

/** Copy both HTML and plain text (falls back to plain text if HTML copy isn’t supported) */
export async function copyHtmlAndText(html: string, text: string) {
  try {
    const winAny = window as any;
    if (navigator.clipboard && winAny.ClipboardItem) {
      const item = new winAny.ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      });
      await (navigator.clipboard as any).write([item]);
      return;
    }
  } catch {
    // fall through to legacy path
  }

  // Fallback: plain text only
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(ta);
  }
}

/**
 * Build chapter export as HTML + plain text:
 * - Keeps rich formatting from text nodes’ stored HTML
 * - No extra spacing between consecutive text nodes
 * - Adds an em dash (—) between scenes (user can delete later)
 */
export function buildChapterExportHtml(
  chapter: ChapterLikeForCopy,
  index: number
): { html: string; text: string } {
  const title = chapter.chapterNode.title || "(Untitled Chapter)";

  // Scene separator
  const sceneSepHTML = `<p style="text-align:center; margin: 1em 0;">—</p>`;
  const sceneSepText = `\n\n—\n\n`;

  const sceneHtmlParts: string[] = [];
  const sceneTextParts: string[] = [];

  chapter.scenes.forEach((sc, sIdx) => {
    const textNodes = sc.nodes.filter(
      (n): n is Extract<NodeData, { type: "text" }> => n.type === "text");

    // Join text nodes with no extra separators (preserve user HTML)
    const htmlChunk = textNodes.map((t) => t.text || "").join("");
    const textChunk = textNodes
      .map((t) => stripHtml(t.text || "").trim())
      .filter(Boolean)
      .join("\n\n"); // small paragraph spacing for plain text only

    if (htmlChunk) {
      if (sIdx > 0) sceneHtmlParts.push(sceneSepHTML);
      sceneHtmlParts.push(htmlChunk);
    }
    if (textChunk) {
      if (sIdx > 0) sceneTextParts.push(sceneSepText);
      sceneTextParts.push(textChunk);
    }
  });

  const preTitleHtml = `
    <div style="
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .06em;
      text-align: center;
      margin: 0 0 .25em 0;
    ">
      Chapter ${index + 1}
    </div>
  `;
  const titleHtml = `<h1 style="margin: .25em 0 1em 0; text-align: center;">${title}</h1>`;

  const html = preTitleHtml + titleHtml + sceneHtmlParts.join("");
  const text = `Chapter ${index + 1}\n\n${title}\n\n` + sceneTextParts.join("");

  return { html, text };
}
