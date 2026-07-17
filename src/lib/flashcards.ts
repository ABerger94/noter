export type FlashcardCourse = { name: string; color: string } | null;
export type FlashcardTag = { id: string; name: string };
export type FlashcardAttachment = { id: string; filename: string };

export type FlashcardSourceNote = {
  id: string;
  title: string;
  content: string;
  course: FlashcardCourse;
  tags: { tag: FlashcardTag }[];
  attachments: FlashcardAttachment[];
};

export type Flashcard = {
  id: string;
  noteId: string;
  noteTitle: string;
  course: FlashcardCourse;
  tags: FlashcardTag[];
  kind: "section" | "term";
  front: string;
  back: string;
  attachments: FlashcardAttachment[];
};

const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const FENCE_RE = /^```/;
// Matches "- **Term**: definition", "**Term** - definition", "* Term: definition", etc.
const DEFINITION_RE = /^(?:[-*]\s+)?\*{0,2}([^*:–-]{1,60}?)\*{0,2}\s*[:–-]\s+(.+)$/;

function stripCodeFences(lines: string[]): boolean[] {
  const inFence: boolean[] = [];
  let fence = false;
  for (const line of lines) {
    if (FENCE_RE.test(line.trim())) {
      inFence.push(true);
      fence = !fence;
    } else {
      inFence.push(fence);
    }
  }
  return inFence;
}

function splitIntoSections(content: string): { heading: string | null; body: string }[] {
  // Textareas submit CRLF line endings, and the raw \r would otherwise break
  // the line-anchored regexes below (^, $ don't treat a trailing \r as
  // absent), so normalize before splitting into lines.
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const inFence = stripCodeFences(lines);

  const headings: { index: number; level: number; text: string }[] = [];
  lines.forEach((line, i) => {
    if (inFence[i]) return;
    const m = line.match(HEADING_RE);
    if (m) headings.push({ index: i, level: m[1].length, text: m[2].trim() });
  });

  if (headings.length === 0) {
    const body = content.trim();
    return body ? [{ heading: null, body }] : [];
  }

  const topLevel = Math.min(...headings.map((h) => h.level));
  const topHeadings = headings.filter((h) => h.level === topLevel);

  const sections: { heading: string | null; body: string }[] = [];

  const preamble = lines.slice(0, topHeadings[0].index).join("\n").trim();
  if (preamble) sections.push({ heading: null, body: preamble });

  topHeadings.forEach((h, i) => {
    const start = h.index + 1;
    const end = i + 1 < topHeadings.length ? topHeadings[i + 1].index : lines.length;
    const body = lines.slice(start, end).join("\n").trim();
    if (body) sections.push({ heading: h.text, body });
  });

  return sections;
}

function extractDefinitions(body: string): { term: string; definition: string }[] {
  const lines = body.split("\n");
  const inFence = stripCodeFences(lines);
  const defs: { term: string; definition: string }[] = [];

  lines.forEach((line, i) => {
    if (inFence[i]) return;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(">")) return;
    const m = trimmed.match(DEFINITION_RE);
    if (!m) return;
    const term = m[1].trim();
    const definition = m[2].trim();
    // Guard against false positives like URLs or "Note: see below" style asides.
    if (!term || term.length > 60 || /^https?:/i.test(definition)) return;
    defs.push({ term, definition });
  });

  return defs;
}

export function buildFlashcards(notes: FlashcardSourceNote[]): Flashcard[] {
  const cards: Flashcard[] = [];

  for (const note of notes) {
    const tags = note.tags.map(({ tag }) => tag);
    const sections = splitIntoSections(note.content);

    if (sections.length === 0) {
      cards.push({
        id: `${note.id}:overview`,
        noteId: note.id,
        noteTitle: note.title,
        course: note.course,
        tags,
        kind: "section",
        front: note.title,
        back: "",
        attachments: note.attachments,
      });
      continue;
    }

    sections.forEach((section, i) => {
      const isFirst = i === 0;
      cards.push({
        id: `${note.id}:section:${i}`,
        noteId: note.id,
        noteTitle: note.title,
        course: note.course,
        tags,
        kind: "section",
        front: section.heading ?? note.title,
        back: section.body,
        // Images aren't tied to a specific section in the data model, so
        // surface them once, on the first card generated for this note.
        attachments: isFirst ? note.attachments : [],
      });

      for (const { term, definition } of extractDefinitions(section.body)) {
        cards.push({
          id: `${note.id}:term:${i}:${term}`,
          noteId: note.id,
          noteTitle: note.title,
          course: note.course,
          tags,
          kind: "term",
          front: term,
          back: definition,
          attachments: [],
        });
      }
    });
  }

  return cards;
}
