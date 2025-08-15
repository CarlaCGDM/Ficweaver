// src/components/Editor/ExportButton/ExportButton.tsx
import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { saveAs } from "file-saver";
import {
  Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType,
  ExternalHyperlink,
  // Optional: LineRule
} from "docx";
import { useStoryStore } from "../../context/storyStore/storyStore";
import type { Story, ChapterNode, SceneNode, TextNode, NodeData } from "../../context/storyStore/types";

/** Safe filename helper */
function fileSafe(name: string) {
  return (name || "My Story").replace(/\s+/g, "_").replace(/[^\w_]/g, "");
}

// --- NEW: pull fonts from your theme via CSS variables (fallbacks safe)
function getThemeFonts() {
  const css = getComputedStyle(document.documentElement);
  // try common variable names you already use around the app
  const bodyVar =
    css.getPropertyValue("--font-body") ||
    css.getPropertyValue("--font-ui") ||
    "";
  const headingVar =
    css.getPropertyValue("--font-heading") ||
    css.getPropertyValue("--font-ui") ||
    "";

  // strip quotes + trim
  const clean = (v: string) => v.replace(/^["']|["']$/g, "").trim();

  const bodyFont = clean(bodyVar) || "Georgia";
  const headingFont = clean(headingVar) || "Inter";
  return { bodyFont, headingFont };
}

/** Tiny HTML→text flattening with paragraph/line breaks preserved enough for export */
function htmlToPlainText(html: string): string {
  // Normalize line breaks first
  let s = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<p[^>]*>/gi, "");
  // Strip remaining tags via content extraction
  const div = document.createElement("div");
  div.innerHTML = s;
  const txt = div.textContent || "";
  return txt.replace(/\r\n/g, "\n");
}

// --- UPDATED: Outline builder that produces both plain + markdown for scenes
function buildOutline(story: Story) {
  const chapters = story.order
    .map((chId) => story.nodeMap[chId])
    .filter((n): n is ChapterNode => !!n && n.type === "chapter");

  return chapters.map((ch, chIndex) => {
    const sceneIds = story.childrenOrder[ch.id] ?? [];
    const scenes = sceneIds
      .map((sid) => story.nodeMap[sid])
      .filter((n): n is SceneNode => !!n && n.type === "scene")
      .map((scene) => {
        const childIds = story.childrenOrder[scene.id] ?? [];
        const textNodes = childIds
          .map((cid) => story.nodeMap[cid])
          .filter((n): n is TextNode => !!n && n.type === "text");

        // Contiguous content per scene:
        // - Markdown: convert each node’s HTML to MD, then join without extra separators.
        const sceneMarkdown = textNodes.map((t) => htmlToMarkdown(t.text || "")).join("");

        return {
          id: scene.id,
          title: scene.title,
          // keep md for markdown export
          md: sceneMarkdown,
          // keep raw htmls for docx export (we'll parse preserving bold/italic/links)
          htmlBlocks: textNodes.map((t) => t.text || ""),
        };
      });

    return {
      id: ch.id,
      number: chIndex + 1,
      title: ch.title,
      scenes,
    };
  });
}


// --- NEW: HTML -> Markdown (preserve bold/italic/links, paragraphs)
function htmlToMarkdown(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;

  const escapeMd = (s: string) =>
    s.replace(/([_*`~[\]()\\])/g, "\\$1"); // light escaping

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeMd((node as Text).data);
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    const inner = Array.from(el.childNodes).map(walk).join("");

    switch (tag) {
      case "br":
        return "  \n"; // markdown line break
      case "p":
      case "div":
        // paragraph -> ensure blank line
        return inner.trim() ? `${inner}\n\n` : "";
      case "strong":
      case "b":
        return inner ? `**${inner}**` : "";
      case "em":
      case "i":
        return inner ? `*${inner}*` : "";
      case "u":
        // markdown has no underline; keep plain text
        return inner;
      case "a": {
        const href = el.getAttribute("href") || "";
        const text = inner || href;
        return href ? `[${text}](${href})` : text;
      }
      case "ul":
        return (
          Array.from(el.children)
            .map((li) => `- ${walk(li)}`.replace(/\n+$/g, "")) // no trailing blanks inside li
            .join("\n") + "\n\n"
        );
      case "ol": {
        let i = 1;
        return (
          Array.from(el.children)
            .map((li) => `${i++}. ${walk(li)}`.replace(/\n+$/g, ""))
            .join("\n") + "\n\n"
        );
      }
      case "li":
        return inner.replace(/\n+$/g, "");
      case "code":
        return `\`${inner}\``;
      case "pre":
        return "```\n" + el.textContent + "\n```\n\n";
      default:
        return inner;
    }
  };

  return walk(div).replace(/\n{3,}/g, "\n\n"); // normalize excessive blanks
}

/** Build Markdown string */
function buildMarkdown(story: Story): string {
  const outline = buildOutline(story);
  const lines: string[] = [];

  // Title
  lines.push(`# ${story.title || "Untitled Story"}`, "");

  outline.forEach((ch) => {
    // "Chapter N" line
    lines.push(`_Chapter ${ch.number}_`);
    // Chapter title as H1
    lines.push(`# ${ch.title || "(Untitled Chapter)"}`, "");

    ch.scenes.forEach((sc, idx) => {
      // Each scene is contiguous: join converted markdown of its text nodes without extra separators
      if (sc.md) lines.push(sc.md.trim());
      // Em dash separator between scenes
      if (idx < ch.scenes.length - 1) lines.push("", "—", "");
    });

    // Spacer between chapters
    lines.push("");
  });

  return lines.join("\n");
}


// Build paragraphs from a single HTML string (preserve bold/italic/links)
function htmlToDocxParagraphs(html: string, opts: { bodyFont: string }) {
  const div = document.createElement("div");
  div.innerHTML = html;

  const paras: Paragraph[] = [];

  const makeParagraph = (
    runs: (TextRun | ExternalHyperlink)[],
    align?: (typeof AlignmentType)[keyof typeof AlignmentType]
  ) =>
    new Paragraph({
      children: runs.length ? runs : [new TextRun("")],
      alignment: align,
      spacing: { line: 360, before: 120, after: 120 }, // 1.5 line, a bit of space before/after
    });

  const makeRun = (text: string, style: { bold?: boolean; italics?: boolean; underline?: boolean }) =>
    new TextRun({
      text,
      bold: style.bold,
      italics: style.italics,
      underline: style.underline ? {} : undefined,
      font: opts.bodyFont,
    });

  const walkInline = (el: Node, ctx: { bold?: boolean; italics?: boolean; underline?: boolean }): (TextRun | ExternalHyperlink)[] => {
    if (el.nodeType === Node.TEXT_NODE) {
      const txt = (el as Text).data;
      return txt ? [makeRun(txt, ctx)] : [];
    }
    if (el.nodeType !== Node.ELEMENT_NODE) return [];

    const node = el as HTMLElement;
    const tag = node.tagName.toLowerCase();

    const nextCtx = { ...ctx };
    if (tag === "strong" || tag === "b") nextCtx.bold = true;
    if (tag === "em" || tag === "i") nextCtx.italics = true;
    if (tag === "u") nextCtx.underline = true;

    if (tag === "a") {
      const href = node.getAttribute("href") || "";
      const childrenRuns = Array.from(node.childNodes).flatMap((c) => walkInline(c, nextCtx));
      const text = (childrenRuns
        .map((r) => (r instanceof TextRun ? (r as any).text : "")) // docx TextRun keeps text private; this is best-effort
        .join("")) || href;

      // Build a clean hyperlink (single run child is fine)
      const linkRun = makeRun(text, nextCtx);
      return [new ExternalHyperlink({ link: href, children: [linkRun] })];
    }

    if (tag === "br") {
      // In docx, line break is a separate TextRun with break
      return [new TextRun({ text: "", break: 1, font: opts.bodyFont })];
    }

    return Array.from(node.childNodes).flatMap((c) => walkInline(c, nextCtx));
  };

  const blockify = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = (node as Text).data.trim();
      if (txt) paras.push(makeParagraph([makeRun(txt, {})]));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    // Block elements -> new paragraph
    if (["p", "div"].includes(tag)) {
      const runs = walkInline(el, {});
      paras.push(makeParagraph(runs));
      return;
    }

    if (tag === "pre") {
      const text = el.textContent || "";
      text.split("\n").forEach((line) => {
        paras.push(makeParagraph([makeRun(line, {})]));
      });
      return;
    }

    if (tag === "ul" || tag === "ol") {
      const items = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === "li");
      items.forEach((li, idx) => {
        const runs = walkInline(li, {});
        const bullet = tag === "ul" ? "• " : `${idx + 1}. `;
        paras.push(makeParagraph([makeRun(bullet, {}), ...runs]));
      });
      return;
    }

    // Inline container -> keep collecting
    const runs = walkInline(el, {});
    if (runs.length) paras.push(makeParagraph(runs));
  };

  Array.from(div.childNodes).forEach(blockify);
  if (paras.length === 0) paras.push(makeParagraph([makeRun("", {})])); // ensure at least one para
  return paras;
}


/** Build DOCX document */
// --- UPDATED: DOCX builder
async function buildDocxBlob(story: Story): Promise<Blob> {
  const outline = buildOutline(story);
  const { bodyFont, headingFont } = getThemeFonts();

  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: story.title || "Untitled Story", font: headingFont }),
      ],
      heading: HeadingLevel.TITLE,
      spacing: { line: 360, after: 240 },
    })
  );

  outline.forEach((ch) => {
    // "Chapter N"
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Chapter ${ch.number}`, italics: true, size: 18, font: headingFont })],
        alignment: AlignmentType.CENTER,
        spacing: { line: 360, before: 120, after: 120 },
      })
    );

    // Chapter title H1
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: ch.title || "(Untitled Chapter)", font: headingFont }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { line: 360, after: 200 },
      })
    );

    // Scenes (each scene = contiguous paragraphs from its text nodes)
    ch.scenes.forEach((sc, idx) => {
      sc.htmlBlocks.forEach((html) => {
        const paras = htmlToDocxParagraphs(html, { bodyFont });
        children.push(...paras);
      });

      // Em dash separator between scenes
      if (idx < ch.scenes.length - 1) {
        children.push(
          new Paragraph({ spacing: { line: 360 }, children: [new TextRun({ text: "" })] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 360 },
            children: [new TextRun({ text: "—", font: bodyFont })],
          }),
          new Paragraph({ spacing: { line: 360 }, children: [new TextRun({ text: "" })] })
        );
      }
    });

    // spacer after chapter
    children.push(new Paragraph({ spacing: { line: 360 }, children: [new TextRun({ text: "" })] }));
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: bodyFont },
          paragraph: { spacing: { line: 360 } }, // keep 1.5 as a global default
        },
      },
    },
    sections: [{ children }],
  });

  return Packer.toBlob(doc);
}


/** The floating round export button with hover menu */
// Option 1: Extend the hover area to include the menu
// Option 1: Extend the hover area to include the menu
export default function ExportButton() {
  const story = useStoryStore((s) => s.story);
  const [open, setOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const fileBase = useMemo(() => fileSafe(story.title), [story.title]);

  const handleExportMD = () => {
    const md = buildMarkdown(story);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    saveAs(blob, `${fileBase}.md`);
    setOpen(false);
  };

  const handleExportDOCX = async () => {
    const blob = await buildDocxBlob(story);
    saveAs(blob, `${fileBase}.docx`);
    setOpen(false);
  };

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{
        position: "absolute",
        right: "1vh",
        bottom: "7vh",
        zIndex: 2000,
        // Add padding to create a larger hover area that includes the gap
        paddingTop: open ? "60px" : "0px",
        paddingLeft: open ? "160px" : "0px",
      }}
    >
      {/* Hover menu */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            bottom: 56,
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            boxShadow: "var(--node-shadow)",
            overflow: "hidden",
            minWidth: 160,
          }}
        >
          <button
            onClick={handleExportDOCX}
            onMouseEnter={() => setHoveredItem('docx')}
            onMouseLeave={() => setHoveredItem(null)}
            style={hoveredItem === 'docx' ? menuItemHoverStyle : menuItemStyle}
            title="Download as .docx"
          >
            Download .docx
          </button>
          <button
            onClick={handleExportMD}
            onMouseEnter={() => setHoveredItem('md')}
            onMouseLeave={() => setHoveredItem(null)}
            style={hoveredItem === 'md' ? menuItemHoverStyle : menuItemStyle}
            title="Download as .md"
          >
            Download .md
          </button>
        </div>
      )}

      {/* Round FAB */}
      <button
        title="Export"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-accent)",
          color: "var(--color-accentText)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--node-shadow)",
          cursor: "pointer",
        }}
      >
        <FileDown size={20} />
      </button>
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  textAlign: "left",
  fontSize: 13,
  color: "var(--color-text)",
  background: "transparent",
  border: "none",
  cursor: "pointer",
};

const menuItemHoverStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  textAlign: "left",
  fontSize: 13,
  color: "var(--color-text)",
  background: "var(--color-panelAlt)",
  border: "none",
  cursor: "pointer",
};