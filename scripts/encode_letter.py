#!/usr/bin/env python3
"""Encode letter_to_daughter.html: base64-encode <body> content, keep <head> as-is."""

import base64
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DRAFT = ROOT / "pages" / "draft_letter_to_daughter.html"
OUTPUT = ROOT / "pages" / "letter_to_daughter.html"


def main():
    if not DRAFT.exists():
        print(f"Error: {DRAFT} not found", file=sys.stderr)
        sys.exit(1)

    html = DRAFT.read_text(encoding="utf-8")

    head_match = re.search(r"<head>(.*?)</head>", html, re.DOTALL)
    body_match = re.search(r"<body>(.*)</body>", html, re.DOTALL)

    if not head_match or not body_match:
        print("Error: could not parse <head> or <body>", file=sys.stderr)
        sys.exit(1)

    head_content = head_match.group(1)
    body_content = body_match.group(1)

    encoded = base64.b64encode(body_content.encode("utf-8")).decode("ascii")

    result = f"""<!DOCTYPE html>
<html lang="ru">
<head>{head_content}</head>
<body>
<script>document.write(decodeURIComponent(escape(atob("{encoded}"))));</script>
</body>
</html>
"""

    OUTPUT.write_text(result, encoding="utf-8")
    print(f"Encoded: {DRAFT.name} -> {OUTPUT.name}")
    print(f"  Body size: {len(body_content):,} chars -> base64: {len(encoded):,} chars")


if __name__ == "__main__":
    main()
