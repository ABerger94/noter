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

// Real-world pasted tables (Excel, Google Sheets, Word, web pages) routinely
// break turndown-plugin-gfm's table conversion:
//  - it only converts a table if every cell in the first row is a <th>;
//    Sheets/Excel export plain <td> header rows, so the whole table gets
//    kept as raw, unrendered HTML instead of becoming a markdown table.
//  - it emits one markdown column per <td>/<th> element and ignores
//    colspan/rowspan, so merged cells shift every following column out of
//    alignment (or drop them entirely).
//  - a multi-line cell (e.g. a wrapped <p> or a <br>) breaks the
//    single-line-per-row pipe table syntax.
// Normalizing each table's DOM before handing it to turndown fixes all three.

function expandColspans(doc: Document, row: HTMLTableRowElement) {
  Array.from(row.cells).forEach((cell) => {
    const span = cell.colSpan || 1;
    const rowSpan = cell.rowSpan || 1;
    cell.removeAttribute("colspan");
    let anchor: Element = cell;
    for (let i = 1; i < span; i++) {
      const filler = doc.createElement(cell.tagName);
      if (rowSpan > 1) filler.setAttribute("rowspan", String(rowSpan));
      anchor.after(filler);
      anchor = filler;
    }
  });
}

// Carries rowspans down into the following rows as blank filler cells, so a
// merged cell doesn't shift every column after it out of alignment in the
// rows below.
function applyRowspanCarry(doc: Document, rows: HTMLTableRowElement[]) {
  const carry: number[] = [];

  rows.forEach((row) => {
    const originalCells = Array.from(row.cells);
    originalCells.forEach((cell) => row.removeChild(cell));

    let col = 0;
    let index = 0;
    while (index < originalCells.length || col < carry.length) {
      if ((carry[col] ?? 0) > 0) {
        const tag = originalCells[0]?.tagName ?? "TD";
        row.appendChild(doc.createElement(tag));
        carry[col] -= 1;
        col += 1;
        continue;
      }
      const cell = originalCells[index];
      if (!cell) break;
      row.appendChild(cell);
      const span = cell.rowSpan || 1;
      cell.removeAttribute("rowspan");
      if (span > 1) carry[col] = span - 1;
      col += 1;
      index += 1;
    }
  });
}

// Pipe-table rows must be a single line, so any block-level content inside
// a cell (a wrapped <p>/<div>, a <br>) needs to collapse to inline content
// with a space instead of a line break - without discarding real inline
// formatting like <strong>/<em>/<a> that may also be in there.
function flattenCellContent(cell: Element) {
  cell.querySelectorAll("br").forEach((br) => {
    br.replaceWith(cell.ownerDocument.createTextNode(" "));
  });
  cell.querySelectorAll("p, div").forEach((block) => {
    const parent = block.parentNode;
    if (!parent) return;
    parent.insertBefore(cell.ownerDocument.createTextNode(" "), block);
    while (block.firstChild) parent.insertBefore(block.firstChild, block);
    parent.removeChild(block);
  });
}

function normalizeTable(doc: Document, table: HTMLTableElement) {
  const rows = Array.from(table.rows);
  if (rows.length === 0) return;

  rows.forEach((row) => expandColspans(doc, row));
  applyRowspanCarry(doc, rows);

  // Force a real heading row (every cell a <th>) so turndown-plugin-gfm
  // converts the table instead of dropping it in as raw HTML.
  const headerRow = table.rows[0];
  if (headerRow) {
    Array.from(headerRow.cells).forEach((cell) => {
      if (cell.tagName === "TH") return;
      const th = doc.createElement("th");
      th.innerHTML = cell.innerHTML;
      cell.replaceWith(th);
    });
  }

  Array.from(table.rows).forEach((row) => {
    Array.from(row.cells).forEach((cell) => flattenCellContent(cell));
  });
}

// Converts clipboard HTML (from Word, Google Docs, a webpage, etc.) into
// the Markdown our editor/renderer already understands, so pasted
// formatting survives instead of landing as one flat block of plain text.
export function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("table").forEach((table) => normalizeTable(doc, table));
  return getService().turndown(doc.body).trim();
}
