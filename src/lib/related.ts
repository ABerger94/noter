export type RelatedNoteInput = {
  id: string;
  title: string;
  content: string;
  course: { id: string; name: string; color: string } | null;
  tags: { tag: { id: string; name: string } }[];
};

export type RelatedNoteResult = {
  id: string;
  title: string;
  course: { name: string; color: string } | null;
  score: number;
};

// Common English words carry no topical signal and would otherwise swamp
// the keyword-overlap score.
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "than", "so", "of",
  "to", "in", "on", "for", "with", "as", "at", "by", "from", "into", "about",
  "is", "are", "was", "were", "be", "been", "being", "am",
  "this", "that", "these", "those", "it", "its", "it's",
  "we", "you", "your", "our", "their", "his", "her", "they", "them", "i",
  "he", "she", "what", "which", "who", "whom", "when", "where", "why", "how",
  "all", "each", "other", "some", "such", "only", "own", "same", "very",
  "can", "will", "just", "should", "now", "also", "more", "most", "like",
  "there", "here", "do", "does", "did", "have", "has", "had", "having",
  "not", "no", "nor", "too", "up", "down", "out", "over", "under", "again",
  "note", "notes",
]);

function tokenize(text: string): string[] {
  const plain = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*_~]/g, " ");
  const words = plain.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? [];
  return words.filter((w) => !STOPWORDS.has(w));
}

function keywordCounts(note: RelatedNoteInput): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (word: string, weight: number) =>
    counts.set(word, (counts.get(word) ?? 0) + weight);
  for (const w of tokenize(note.title)) add(w, 3);
  for (const w of tokenize(note.content)) add(w, 1);
  return counts;
}

export function computeRelatedNotes(
  targetId: string,
  notes: RelatedNoteInput[],
  limit = 5
): RelatedNoteResult[] {
  const target = notes.find((n) => n.id === targetId);
  if (!target) return [];

  const keywordMaps = new Map<string, Map<string, number>>();
  const docFreq = new Map<string, number>();

  for (const note of notes) {
    const counts = keywordCounts(note);
    keywordMaps.set(note.id, counts);
    for (const word of counts.keys()) {
      docFreq.set(word, (docFreq.get(word) ?? 0) + 1);
    }
  }

  const targetCounts = keywordMaps.get(targetId)!;
  const targetTagIds = new Set(target.tags.map(({ tag }) => tag.id));

  return notes
    .filter((note) => note.id !== targetId)
    .map((note) => {
      const counts = keywordMaps.get(note.id)!;
      let score = 0;

      for (const [word, weight] of targetCounts) {
        const otherWeight = counts.get(word);
        if (!otherWeight) continue;
        const df = docFreq.get(word) ?? 1;
        const idf = Math.log((notes.length + 1) / df) + 1;
        score += weight * otherWeight * idf;
      }

      const sharedTags = note.tags.filter(({ tag }) => targetTagIds.has(tag.id)).length;
      score += sharedTags * 25;

      if (target.course && note.course && target.course.id === note.course.id) {
        score += 3;
      }

      return { id: note.id, title: note.title, course: note.course, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
