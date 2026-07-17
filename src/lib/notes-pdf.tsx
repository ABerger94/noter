import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

export type PdfCourse = { name: string; color: string } | null;
export type PdfTag = { id: string; name: string };

export type PdfSourceNote = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  course: PdfCourse;
  tags: { tag: PdfTag }[];
};

// A deliberately loose shape for the subset of mdast we render - avoids
// pulling in the `mdast`/`mdast-util-*` type packages just for type-only
// imports.
type MdNode = {
  type: string;
  value?: string;
  depth?: number;
  ordered?: boolean;
  start?: number | null;
  alt?: string | null;
  url?: string;
  children?: MdNode[];
};

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica", color: "#1e293b" },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  meta: { fontSize: 9, color: "#64748b", marginBottom: 16 },
  h1: { fontSize: 17, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 6 },
  h2: { fontSize: 15, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 6 },
  h3: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 10, marginBottom: 4 },
  paragraph: { marginBottom: 8, lineHeight: 1.4 },
  listItemRow: { flexDirection: "row", marginBottom: 4 },
  bullet: { width: 16, lineHeight: 1.4 },
  listItemBody: { flex: 1 },
  code: {
    fontFamily: "Courier",
    fontSize: 9.5,
    backgroundColor: "#f1f5f9",
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  inlineCode: { fontFamily: "Courier", fontSize: 10, backgroundColor: "#f1f5f9" },
  blockquote: {
    borderLeftWidth: 2,
    borderLeftColor: "#cbd5e1",
    paddingLeft: 10,
    marginBottom: 8,
    fontStyle: "italic",
    color: "#475569",
  },
  hr: { borderBottomWidth: 1, borderBottomColor: "#cbd5e1", marginVertical: 12 },
  table: { marginBottom: 8, borderWidth: 1, borderColor: "#cbd5e1" },
  tableRow: { flexDirection: "row" },
  tableCell: { flex: 1, borderWidth: 1, borderColor: "#cbd5e1", padding: 4, fontSize: 9.5 },
  tableCellHeader: { fontFamily: "Helvetica-Bold" },
});

function parseMarkdown(content: string): MdNode {
  const processor = unified().use(remarkParse).use(remarkGfm);
  const tree = processor.parse(content);
  return processor.runSync(tree) as unknown as MdNode;
}

function renderInline(nodes: MdNode[] | undefined, keyPrefix: string): ReactNode[] {
  if (!nodes) return [];
  return nodes.map((node, i) => renderInlineNode(node, `${keyPrefix}-${i}`));
}

function renderInlineNode(node: MdNode, key: string): ReactNode {
  switch (node.type) {
    case "strong":
      return (
        <Text key={key} style={{ fontFamily: "Helvetica-Bold" }}>
          {renderInline(node.children, key)}
        </Text>
      );
    case "emphasis":
      return (
        <Text key={key} style={{ fontStyle: "italic" }}>
          {renderInline(node.children, key)}
        </Text>
      );
    case "delete":
      return (
        <Text key={key} style={{ textDecoration: "line-through" }}>
          {renderInline(node.children, key)}
        </Text>
      );
    case "inlineCode":
      return (
        <Text key={key} style={styles.inlineCode}>
          {node.value}
        </Text>
      );
    case "break":
      return <Text key={key}>{"\n"}</Text>;
    case "link":
      return (
        <Text key={key} style={{ color: "#4f46e5" }}>
          {renderInline(node.children, key)}
        </Text>
      );
    case "image":
      return (
        <Text key={key} style={{ color: "#94a3b8" }}>
          {`[image: ${node.alt || node.url || ""}]`}
        </Text>
      );
    case "text":
    default:
      return <Text key={key}>{node.value ?? ""}</Text>;
  }
}

function renderBlock(node: MdNode, key: string): ReactNode {
  switch (node.type) {
    case "heading": {
      const level = Math.min(node.depth ?? 1, 3);
      const style = level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;
      return (
        <Text key={key} style={style}>
          {renderInline(node.children, key)}
        </Text>
      );
    }
    case "paragraph":
      return (
        <Text key={key} style={styles.paragraph}>
          {renderInline(node.children, key)}
        </Text>
      );
    case "list":
      return (
        <View key={key}>
          {(node.children ?? []).map((item, i) => (
            <View key={`${key}-${i}`} style={styles.listItemRow} wrap={false}>
              <Text style={styles.bullet}>
                {node.ordered ? `${(node.start ?? 1) + i}.` : "•"}
              </Text>
              <View style={styles.listItemBody}>
                {(item.children ?? []).map((child, j) => renderBlock(child, `${key}-${i}-${j}`))}
              </View>
            </View>
          ))}
        </View>
      );
    case "code":
      return (
        <View key={key} style={styles.code} wrap={false}>
          {(node.value ?? "").split("\n").map((line, i) => (
            <Text key={i}>{line || " "}</Text>
          ))}
        </View>
      );
    case "blockquote":
      return (
        <View key={key} style={styles.blockquote}>
          {(node.children ?? []).map((child, i) => renderBlock(child, `${key}-${i}`))}
        </View>
      );
    case "thematicBreak":
      return <View key={key} style={styles.hr} />;
    case "table": {
      const [headerRow, ...bodyRows] = node.children ?? [];
      if (!headerRow) return null;
      return (
        <View key={key} style={styles.table} wrap={false}>
          <View style={styles.tableRow}>
            {(headerRow.children ?? []).map((cell, i) => (
              <View key={i} style={styles.tableCell}>
                <Text style={styles.tableCellHeader}>
                  {renderInline(cell.children, `${key}-h-${i}`)}
                </Text>
              </View>
            ))}
          </View>
          {bodyRows.map((row, ri) => (
            <View key={ri} style={styles.tableRow}>
              {(row.children ?? []).map((cell, ci) => (
                <View key={ci} style={styles.tableCell}>
                  <Text>{renderInline(cell.children, `${key}-${ri}-${ci}`)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }
    default:
      return null;
  }
}

function NotesDocument({ notes }: { notes: PdfSourceNote[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {notes.map((note, i) => {
          const tree = parseMarkdown(note.content);
          const meta = [
            note.course?.name,
            note.tags.map((t) => `#${t.tag.name}`).join(" "),
            new Date(note.createdAt).toLocaleDateString(),
          ]
            .filter(Boolean)
            .join("   ·   ");

          return (
            <View key={note.id} break={i > 0}>
              <Text style={styles.title}>{note.title}</Text>
              {meta && <Text style={styles.meta}>{meta}</Text>}
              {(tree.children ?? []).map((child, j) => renderBlock(child, `${note.id}-${j}`))}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}

export async function renderNotesPdf(notes: PdfSourceNote[]): Promise<Buffer> {
  return renderToBuffer(<NotesDocument notes={notes} />);
}
