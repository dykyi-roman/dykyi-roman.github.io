#!/usr/bin/env python3
"""Extract knowledge units from pages/principles.html and pages/book/*.html
into resources/knowledge-data.js (KNOWLEDGE_META + KNOWLEDGE_DATA).

Usage:
    python3 scripts/extract_knowledge.py           # regenerate resources/knowledge-data.js
    python3 scripts/extract_knowledge.py --check   # parse and print summary, write nothing

Item types: principle (principles.html), term (book Vocabulary),
quote (book Notes), insight (book Review structured blocks).
"""

import hashlib
import json
import re
import sys
from datetime import date
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRINCIPLES = ROOT / "pages" / "principles.html"
BOOKS_DIR = ROOT / "pages" / "book"
OUTPUT = ROOT / "resources" / "knowledge-data.js"

VOID_TAGS = {"br", "hr", "img", "meta", "link", "input", "area", "base",
             "col", "embed", "source", "track", "wbr"}
BLOCK_END_TAGS = {"p", "h3", "h4", "h5", "li", "div", "ul", "ol"}
INSIGHT_CLASSES = {"principle", "principle-box", "law-container", "skill-container"}
TYPE_PREFIX = {"principle": "p", "term": "t", "quote": "q", "insight": "i"}


def normalize_text(raw):
    """Collapse spaces, trim each line, collapse blank lines."""
    raw = raw.replace("\u00a0", " ")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in raw.split("\n")]
    text = "\n".join(lines)
    text = re.sub(r"\n{2,}", "\n", text)
    return text.strip()


def split_bold_prefix(runs):
    """If the collected runs start with bold text, return (bold_prefix, rest);
    otherwise (None, full_text). runs is a list of (text, is_bold)."""
    i = 0
    n = len(runs)
    while i < n and not runs[i][0].strip():
        i += 1
    if i >= n or not runs[i][1]:
        return None, "".join(t for t, _ in runs)
    title_parts = []
    while i < n:
        text, bold = runs[i]
        if bold:
            title_parts.append(text)
            i += 1
        elif not text.strip():
            j = i
            while j < n and not runs[j][0].strip():
                j += 1
            if j < n and runs[j][1]:
                title_parts.append(" ")
                i = j
            else:
                break
        else:
            break
    rest = "".join(t for t, _ in runs[i:])
    return "".join(title_parts), rest


def strip_leading_separators(text):
    return re.sub(r"^[\s:—–-]+", "", text)


def strip_title(raw):
    return normalize_text(raw).strip().rstrip(":—–").strip()


class BaseParser(HTMLParser):
    """Tag stack + text-run collector shared by both source parsers.

    Subclasses react via on_start/on_end/on_text. Text is captured only while
    self.collecting is True; bold covers <strong> and <b>; block-level end tags
    and <br> insert "\\n" boundaries into the run stream.
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []          # (tag, classes frozenset, id or None)
        self.bold_depth = 0
        self.collecting = False
        self.runs = []           # (text, is_bold)
        self.items = []
        self.warnings = []

    # -- HTMLParser hooks ---------------------------------------------------

    def handle_starttag(self, tag, attrs):
        if tag in VOID_TAGS:
            if tag == "br":
                self.boundary()
            return
        attrs_dict = dict(attrs)
        classes = frozenset((attrs_dict.get("class") or "").split())
        elem_id = attrs_dict.get("id")
        self.stack.append((tag, classes, elem_id))
        if tag in ("strong", "b"):
            self.bold_depth += 1
        self.on_start(tag, classes, elem_id, attrs_dict)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if tag in VOID_TAGS:
            return
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                closed = self.stack[i:]
                del self.stack[i:]
                for t, classes, elem_id in reversed(closed):
                    if t in ("strong", "b"):
                        self.bold_depth = max(0, self.bold_depth - 1)
                    if t in BLOCK_END_TAGS:
                        self.boundary()
                    self.on_end(t, classes, elem_id)
                return

    def handle_data(self, data):
        # raw newlines in HTML render as spaces; structural "\n" comes only
        # from boundary() on block-level tags
        self.on_text(data.replace("\r", " ").replace("\n", " "))

    # -- helpers ------------------------------------------------------------

    def boundary(self):
        if self.collecting:
            self.runs.append(("\n", False))

    def capture(self, data):
        if self.collecting:
            self.runs.append((data, self.bold_depth > 0))

    def take_runs(self):
        runs = self.runs
        self.runs = []
        return runs

    def warn(self, message):
        self.warnings.append(message)

    # -- subclass interface -------------------------------------------------

    def on_start(self, tag, classes, elem_id, attrs):
        pass

    def on_end(self, tag, classes, elem_id):
        pass

    def on_text(self, data):
        self.capture(data)


class PrinciplesParser(BaseParser):
    """296 principles: <main id="main-content"> ... <li><span>text</span></li>.
    Captures text only inside li > span, so stray <h4>/<hr> inside <ul>,
    intro <p> blocks and the password overlay never leak into items."""

    def __init__(self):
        super().__init__()
        self.in_main = False
        self.section_id = None
        self.category = None
        self.subcategory = None
        self.in_li = False
        self.header_kind = None   # 'cat' | 'sub' while collecting an h3 header
        self.header_buf = []

    def on_start(self, tag, classes, elem_id, attrs):
        if tag == "main" and elem_id == "main-content":
            self.in_main = True
            return
        if not self.in_main:
            return
        if tag == "div" and elem_id and elem_id.endswith("-section"):
            self.section_id = elem_id
            self.category = None
            self.subcategory = None
        elif tag == "h3" and len(self.stack) >= 2:
            parent_classes = self.stack[-2][1]
            if "accordion-header" in parent_classes:
                self.header_kind = "cat"
                self.header_buf = []
            elif "sub-accordion-header" in parent_classes:
                self.header_kind = "sub"
                self.header_buf = []
        elif tag == "li" and self.section_id:
            self.in_li = True
        elif tag == "span" and self.in_li and not self.collecting:
            self.collecting = True
            self.runs = []

    def on_end(self, tag, classes, elem_id):
        if tag == "main":
            self.in_main = False
        elif tag == "h3" and self.header_kind:
            text = normalize_text("".join(self.header_buf))
            if self.header_kind == "cat":
                self.category = text
                self.subcategory = None
            else:
                self.subcategory = text
            self.header_kind = None
        elif tag == "span" and self.collecting:
            self.collecting = False
            self.emit(self.take_runs())
        elif tag == "li":
            self.in_li = False

    def on_text(self, data):
        if self.header_kind is not None:
            self.header_buf.append(data)
        else:
            self.capture(data)

    def emit(self, runs):
        title_raw, rest_raw = split_bold_prefix(runs)
        if title_raw is not None and re.match(r"^[:—–-]", rest_raw.lstrip()):
            title = strip_title(title_raw)
            text = normalize_text(strip_leading_separators(rest_raw))
        else:
            title = None
            text = normalize_text("".join(t for t, _ in runs))
        if not text:
            return
        item = {"type": "principle", "src": "principles"}
        if self.category:
            item["category"] = self.category
        if self.subcategory:
            item["subcategory"] = self.subcategory
        if self.section_id:
            item["ref"] = self.section_id
        if title:
            item["title"] = title
        item["text"] = text
        self.items.append(item)


class BookParser(BaseParser):
    """One book review page. Sections are tracked by id="*-section" (class is
    ignored — survives the 'sectiona' typo). Emits term/quote/insight items."""

    def __init__(self, slug):
        super().__init__()
        self.slug = slug
        self.book_title = None
        self.book_author = None
        self.in_jsonld = False
        self.jsonld_buf = []
        self.section_id = None
        self.ul_depth = 0
        self.li_open = False
        # vocabulary format B (note-card)
        self.card_open = False
        self.card_title = None
        # review insight containers
        self.insight_open = False
        self.insight_title = None
        self.suppressed = False   # inside div.example
        # h4/h5/principle-title text collection
        self.title_kind = None    # 'card' | 'insight' | 'book'
        self.title_buf = []
        self.sentinels = 0

    # -- section bookkeeping ------------------------------------------------

    def close_open_entries(self):
        if self.li_open:
            self.finish_li_entry()
        if self.card_open:
            self.finish_card()
        if self.insight_open:
            self.finish_insight()

    def on_start(self, tag, classes, elem_id, attrs):
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.in_jsonld = True
            self.jsonld_buf = []
            return
        if elem_id and elem_id.endswith("-section"):
            self.close_open_entries()
            self.section_id = elem_id
            self.ul_depth = 0
            return
        if self.section_id == "book-section":
            if tag == "h3" and self.book_title is None and self.title_kind is None:
                self.title_kind = "book"
                self.title_buf = []
        elif self.section_id in ("vocabulary-section", "notes-section"):
            if "note-card" in classes:
                self.close_open_entries()
                self.card_open = True
                self.card_title = None
                self.collecting = True
                self.runs = []
            elif tag in ("ul", "ol"):
                self.ul_depth += 1
            elif tag == "li" and self.card_open:
                self.runs.append(("\n— ", False))
            elif tag == "li" and self.ul_depth == 1:
                if self.li_open:
                    self.finish_li_entry()
                self.li_open = True
                self.collecting = True
                self.runs = []
            elif tag == "h4" and self.card_open:
                self.title_kind = "card"
                self.title_buf = []
        elif self.section_id == "review-section":
            if not self.insight_open and tag == "div" and classes & INSIGHT_CLASSES:
                self.insight_open = True
                self.insight_title = None
                self.suppressed = False
                self.collecting = True
                self.runs = []
            elif self.insight_open:
                if tag == "div" and "example" in classes:
                    self.suppressed = True
                    self.collecting = False
                elif "principle-title" in classes or (
                        tag in ("h4", "h5") and self.insight_title is None):
                    if not self.suppressed:
                        self.title_kind = "insight"
                        self.title_buf = []
                elif tag == "li" and not self.suppressed:
                    self.runs.append(("\n— ", False))
                elif tag == "span" and classes & {"essence", "how-to"}:
                    self.boundary()

    def on_end(self, tag, classes, elem_id):
        if tag == "script" and self.in_jsonld:
            self.in_jsonld = False
            self.parse_jsonld("".join(self.jsonld_buf))
            return
        if self.title_kind is not None and (
                tag in ("h3", "h4", "h5") or "principle-title" in classes):
            text = strip_title("".join(self.title_buf))
            if self.title_kind == "book":
                self.book_title = self.book_title or text
            elif self.title_kind == "card":
                self.card_title = text
            elif self.title_kind == "insight":
                self.insight_title = self.insight_title or text
            self.title_kind = None
            return
        if elem_id and elem_id == self.section_id:
            self.close_open_entries()
            self.section_id = None
            return
        if self.section_id in ("vocabulary-section", "notes-section"):
            if tag in ("ul", "ol"):
                self.ul_depth = max(0, self.ul_depth - 1)
            elif tag == "li" and self.li_open and self.ul_depth == 1:
                self.finish_li_entry()
            elif "note-card" in classes and self.card_open:
                self.finish_card()
        elif self.section_id == "review-section" and self.insight_open:
            if tag == "div" and "example" in classes and self.suppressed:
                self.suppressed = False
                self.collecting = True
            elif tag == "div" and classes & INSIGHT_CLASSES:
                self.finish_insight()

    def on_text(self, data):
        if self.in_jsonld:
            self.jsonld_buf.append(data)
        elif self.title_kind is not None:
            self.title_buf.append(data)
        else:
            self.capture(data)

    # -- emitters -----------------------------------------------------------

    def parse_jsonld(self, raw):
        try:
            data = json.loads(raw)
            reviewed = data.get("itemReviewed", {})
            self.book_title = reviewed.get("name") or self.book_title
            author = reviewed.get("author")
            if isinstance(author, dict):
                self.book_author = author.get("name")
        except (ValueError, AttributeError):
            self.warn(f"{self.slug}: unreadable JSON-LD, falling back to <h3>")

    def finish_li_entry(self):
        self.li_open = False
        self.collecting = False
        runs = self.take_runs()
        if self.section_id == "vocabulary-section":
            self.emit_term_from_runs(runs)
        else:
            self.emit_quote(runs)

    def emit_term_from_runs(self, runs):
        title_raw, rest_raw = split_bold_prefix(runs)
        if title_raw is not None:
            title = strip_title(title_raw)
            text = normalize_text(strip_leading_separators(rest_raw))
        else:
            full = normalize_text("".join(t for t, _ in runs))
            if not full:
                return
            parts = re.split(r"\s[—–]\s", full, maxsplit=1)
            if len(parts) == 2:
                title, text = strip_title(parts[0]), parts[1].strip()
            else:
                self.warn(f"{self.slug}: vocabulary entry without term/definition "
                          f"separator dropped: {full[:60]!r}")
                return
        if not title or not text:
            self.warn(f"{self.slug}: incomplete vocabulary entry dropped "
                      f"(title={title!r})")
            return
        self.items.append({"type": "term", "src": self.slug,
                           "title": title, "text": text})

    def emit_quote(self, runs):
        text = normalize_text("".join(t for t, _ in runs))
        if not text or text == "Not saved":
            if text:
                self.sentinels += 1
            return
        self.items.append({"type": "quote", "src": self.slug, "text": text})

    def finish_card(self):
        self.card_open = False
        self.collecting = False
        runs = self.take_runs()
        text = normalize_text("".join(t for t, _ in runs))
        if not self.card_title or not text:
            self.warn(f"{self.slug}: incomplete note-card dropped "
                      f"(title={self.card_title!r})")
            return
        self.items.append({"type": "term", "src": self.slug,
                           "title": self.card_title, "text": text})

    def finish_insight(self):
        self.insight_open = False
        self.collecting = False
        self.suppressed = False
        runs = self.take_runs()
        title = self.insight_title
        if title:
            text = normalize_text("".join(t for t, _ in runs))
        else:
            title_raw, rest_raw = split_bold_prefix(runs)
            if title_raw is None:
                self.warn(f"{self.slug}: insight without title dropped")
                return
            title = strip_title(title_raw)
            text = normalize_text(strip_leading_separators(rest_raw))
        if not title or not text:
            self.warn(f"{self.slug}: incomplete insight dropped (title={title!r})")
            return
        self.items.append({"type": "insight", "src": self.slug,
                           "title": title, "text": text})


def make_id(item):
    digest = hashlib.sha1(
        ((item.get("title") or "") + "\n" + item["text"]).encode("utf-8")
    ).hexdigest()[:8]
    return f"{TYPE_PREFIX[item['type']]}-{item['src']}-{digest}"


def js_escape(serialized):
    return serialized.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


def ordered_item(item):
    out = {"id": item["id"]}
    for key in ("type", "src", "category", "subcategory", "ref", "title", "text"):
        if key in item:
            out[key] = item[key]
    return out


def main():
    check_only = "--check" in sys.argv

    if not PRINCIPLES.exists() or not BOOKS_DIR.is_dir():
        print("Error: source pages not found", file=sys.stderr)
        sys.exit(1)

    all_items = []
    warnings = []
    stats = []  # (src, {type: count})

    parser = PrinciplesParser()
    parser.feed(PRINCIPLES.read_text(encoding="utf-8"))
    parser.close()
    all_items.extend(parser.items)
    warnings.extend(parser.warnings)
    stats.append(("principles", {"principle": len(parser.items)}))

    sources = {"principles": {"kind": "principles", "title": "Life Principles",
                              "url": "principles.html"}}

    for path in sorted(BOOKS_DIR.glob("*.html")):
        if path.name == "template.html":
            continue
        slug = path.stem
        book = BookParser(slug)
        book.feed(path.read_text(encoding="utf-8"))
        book.close()
        all_items.extend(book.items)
        warnings.extend(book.warnings)
        counts = {}
        for item in book.items:
            counts[item["type"]] = counts.get(item["type"], 0) + 1
        if book.sentinels:
            warnings.append(f"{slug}: {book.sentinels} sentinel note(s) skipped")
        stats.append((slug, counts))
        source = {"kind": "book", "title": book.book_title or slug,
                  "url": f"book/{slug}.html"}
        if book.book_author:
            source["author"] = book.book_author
        if not book.book_title:
            warnings.append(f"{slug}: book title not found, slug used")
        sources[slug] = source

    # exact-duplicate removal within (src, type, title, text)
    seen = set()
    items = []
    for item in all_items:
        key = (item["src"], item["type"], item.get("title"), item["text"])
        if key in seen:
            label = item.get("title") or item["text"][:50]
            warnings.append(f"{item['src']}: duplicate {item['type']} removed: "
                            f"{label!r}")
            continue
        seen.add(key)
        items.append(item)

    # stable content-hash ids
    used_ids = set()
    for item in items:
        base = make_id(item)
        candidate = base
        suffix = 2
        while candidate in used_ids:
            candidate = f"{base}-{suffix}"
            suffix += 1
            warnings.append(f"id collision resolved: {candidate}")
        item["id"] = candidate
        used_ids.add(candidate)

    counts = {"total": len(items)}
    for type_name in ("principle", "term", "quote", "insight"):
        counts[type_name] = sum(1 for item in items if item["type"] == type_name)

    if counts["total"] == 0:
        print("Error: no items extracted", file=sys.stderr)
        sys.exit(1)

    # summary table
    print(f"{'Source':<58}{'princ':>6}{'term':>6}{'quote':>7}{'insight':>8}")
    for src, src_counts in stats:
        print(f"{src:<58}"
              f"{src_counts.get('principle', 0) or '-':>6}"
              f"{src_counts.get('term', 0) or '-':>6}"
              f"{src_counts.get('quote', 0) or '-':>7}"
              f"{src_counts.get('insight', 0) or '-':>8}")
    print(f"{'TOTAL':<58}{counts['principle']:>6}{counts['term']:>6}"
          f"{counts['quote']:>7}{counts['insight']:>8}")
    print(f"Total items: {counts['total']}")
    with_title = sum(1 for item in items
                     if item["type"] == "principle" and "title" in item)
    print(f"Principles with title: {with_title}")
    if warnings:
        print(f"\n{len(warnings)} warning(s):")
        for message in warnings:
            print(f"  WARN {message}")

    if check_only:
        print("\n--check: nothing written")
        return

    meta = {"version": 1, "generated": date.today().isoformat(),
            "counts": counts, "sources": sources}
    assert len({item["id"] for item in items}) == len(items)

    lines = ",\n".join(
        js_escape(json.dumps(ordered_item(item), ensure_ascii=False))
        for item in items)
    content = (
        "// AUTO-GENERATED FILE — DO NOT EDIT BY HAND.\n"
        "// Generated by scripts/extract_knowledge.py from pages/principles.html"
        " + pages/book/*.html\n"
        "// Regenerate: make knowledge   (or: python3 scripts/extract_knowledge.py)\n"
        f"const KNOWLEDGE_META = {js_escape(json.dumps(meta, ensure_ascii=False, indent=2))};\n"
        f"const KNOWLEDGE_DATA = [\n{lines}\n];\n")
    OUTPUT.write_text(content, encoding="utf-8")
    print(f"\nWritten: {OUTPUT.relative_to(ROOT)} "
          f"({len(content.encode('utf-8')):,} bytes)")


if __name__ == "__main__":
    main()
