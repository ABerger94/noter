export type RelatedItemKind = "note" | "document";

export type RelatedItemInput = {
  id: string;
  title: string;
  content: string;
  kind: RelatedItemKind;
  course: { id: string; name: string; color: string } | null;
  tags: { tag: { id: string; name: string } }[];
};

export type RelatedItemResult = {
  id: string;
  title: string;
  kind: RelatedItemKind;
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

function keywordCounts(item: RelatedItemInput): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (word: string, weight: number) =>
    counts.set(word, (counts.get(word) ?? 0) + weight);
  for (const w of tokenize(item.title)) add(w, 3);
  for (const w of tokenize(item.content)) add(w, 1);
  return counts;
}

export function computeRelatedItems(
  targetId: string,
  items: RelatedItemInput[],
  limit = 5
): RelatedItemResult[] {
  const target = items.find((n) => n.id === targetId);
  if (!target) return [];

  const keywordMaps = new Map<string, Map<string, number>>();
  const docFreq = new Map<string, number>();

  for (const item of items) {
    const counts = keywordCounts(item);
    keywordMaps.set(item.id, counts);
    for (const word of counts.keys()) {
      docFreq.set(word, (docFreq.get(word) ?? 0) + 1);
    }
  }

  const targetCounts = keywordMaps.get(targetId)!;
  const targetTagIds = new Set(target.tags.map(({ tag }) => tag.id));

  return items
    .filter((item) => item.id !== targetId)
    .map((item) => {
      const counts = keywordMaps.get(item.id)!;
      let score = 0;

      for (const [word, weight] of targetCounts) {
        const otherWeight = counts.get(word);
        if (!otherWeight) continue;
        const df = docFreq.get(word) ?? 1;
        const idf = Math.log((items.length + 1) / df) + 1;
        score += weight * otherWeight * idf;
      }

      const sharedTags = item.tags.filter(({ tag }) => targetTagIds.has(tag.id)).length;
      score += sharedTags * 25;

      if (target.course && item.course && target.course.id === item.course.id) {
        score += 3;
      }

      return { id: item.id, title: item.title, kind: item.kind, course: item.course, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
