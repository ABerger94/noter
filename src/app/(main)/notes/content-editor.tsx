"use client";

import { useEffect, useRef, useState } from "react";
import MarkdownContent from "./markdown-content";

type Selection = { start: number; end: number };

function wrapSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string,
  placeholder: string
): { value: string; selection: Selection } {
  const selected = value.slice(selectionStart, selectionEnd) || placeholder;
  const newValue =
    value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);
  const start = selectionStart + before.length;
  return { value: newValue, selection: { start, end: start + selected.length } };
}

function prefixLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string
): { value: string; selection: Selection } {
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const nextBreak = value.indexOf("\n", selectionEnd);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;

  const block = value.slice(lineStart, lineEnd);
  const lines = block.split("\n");
  const contentLines = lines.filter((l) => l.trim() !== "");
  const allPrefixed =
    contentLines.length > 0 && contentLines.every((l) => l.startsWith(prefix));

  const newLines = lines.map((l) => {
    if (l.trim() === "") return l;
    return allPrefixed ? l.slice(prefix.length) : prefix + l;
  });
  const newBlock = newLines.join("\n");
  const newValue = value.slice(0, lineStart) + newBlock + value.slice(lineEnd);
  return { value: newValue, selection: { start: lineStart, end: lineStart + newBlock.length } };
}

const TOOLBAR_BUTTONS: {
  label: string;
  title: string;
  apply: (value: string, start: number, end: number) => { value: string; selection: Selection };
}[] = [
  {
    label: "B",
    title: "Bold",
    apply: (v, s, e) => wrapSelection(v, s, e, "**", "**", "bold text"),
  },
  {
    label: "I",
    title: "Italic",
    apply: (v, s, e) => wrapSelection(v, s, e, "*", "*", "italic text"),
  },
  {
    label: "H2",
    title: "Heading",
    apply: (v, s, e) => prefixLines(v, s, e, "## "),
  },
  {
    label: "• List",
    title: "Bulleted list",
    apply: (v, s, e) => prefixLines(v, s, e, "- "),
  },
  {
    label: "1. List",
    title: "Numbered list",
    apply: (v, s, e) => prefixLines(v, s, e, "1. "),
  },
  {
    label: "❝ Quote",
    title: "Quote",
    apply: (v, s, e) => prefixLines(v, s, e, "> "),
  },
  {
    label: "</>",
    title: "Inline code",
    apply: (v, s, e) => wrapSelection(v, s, e, "`", "`", "code"),
  },
  {
    label: "Link",
    title: "Link",
    apply: (v, s, e) => {
      const selected = v.slice(s, e) || "link text";
      const insertion = `[${selected}](https://)`;
      const newValue = v.slice(0, s) + insertion + v.slice(e);
      const urlStart = s + selected.length + 3;
      return { value: newValue, selection: { start: urlStart, end: urlStart + 8 } };
    },
  },
];

export default function ContentEditor({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  const [content, setContent] = useState(defaultValue ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelection = useRef<Selection | null>(null);

  useEffect(() => {
    if (pendingSelection.current && textareaRef.current) {
      const { start, end } = pendingSelection.current;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start, end);
      pendingSelection.current = null;
    }
  }, [content]);

  function runAction(apply: (v: string, s: number, e: number) => { value: string; selection: Selection }) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const result = apply(value, selectionStart, selectionEnd);
    pendingSelection.current = result.selection;
    setContent(result.value);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg border border-b-0 border-slate-300 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap gap-1">
          {TOOLBAR_BUTTONS.map((btn) => (
            <button
              key={btn.label}
              type="button"
              title={btn.title}
              tabIndex={tab === "write" ? 0 : -1}
              disabled={tab !== "write"}
              onClick={() => runAction(btn.apply)}
              className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={`rounded px-2 py-1 ${
              tab === "write"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`rounded px-2 py-1 ${
              tab === "preview"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        name={name}
        rows={16}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={"Write your notes here...\n\nUse the toolbar above, or type Markdown directly."}
        className={`w-full rounded-b-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${
          tab === "write" ? "block" : "hidden"
        }`}
      />

      {tab === "preview" && (
        <div className="min-h-[24rem] rounded-b-lg border border-slate-300 px-4 py-3 dark:border-slate-700">
          {content.trim() ? (
            <div className="prose prose-slate max-w-none dark:prose-invert">
              <MarkdownContent content={content} />
            </div>
          ) : (
            <p className="text-sm text-slate-400">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
