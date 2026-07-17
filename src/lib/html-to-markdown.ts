import TurndownService from "turndown";
// @ts-expect-error - turndown-plugin-gfm ships no type declarations
import { gfm } from "turndown-plugin-gfm";

let service: TurndownService | null = null;

function getService(): TurndownService {
  if (!service) {
    service = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      emDelimiter: "*",
    });
    service.use(gfm);
  }
  return service;
}

// Converts clipboard HTML (from Word, Google Docs, a webpage, etc.) into
// the Markdown our editor/renderer already understands, so pasted
// formatting survives instead of landing as one flat block of plain text.
export function htmlToMarkdown(html: string): string {
  return getService().turndown(html).trim();
}
