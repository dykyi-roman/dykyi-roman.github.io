#!/usr/bin/env python3
"""Decode letter_to_daughter.html: extract base64 body and restore readable HTML."""

import base64
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENCODED = ROOT / "pages" / "letter_to_daughter.html"
OUTPUT = ROOT / "pages" / "encoded_draft_letter_to_daughter.html"


def main():
    if not ENCODED.exists():
        print(f"Error: {ENCODED} not found", file=sys.stderr)
        sys.exit(1)

    html = ENCODED.read_text(encoding="utf-8")

    head_match = re.search(r"<head>(.*?)</head>", html, re.DOTALL)
    b64_match = re.search(r'atob\("([A-Za-z0-9+/=]+)"\)', html)

    if not head_match or not b64_match:
        print("Error: could not parse encoded file", file=sys.stderr)
        sys.exit(1)

    head_content = head_match.group(1)
    body_content = base64.b64decode(b64_match.group(1)).decode("utf-8")

    result = f"""<!DOCTYPE html>
<html lang="ru">
<head>{head_content}</head>
<body>{body_content}</body>
</html>
"""

    OUTPUT.write_text(result, encoding="utf-8")
    print(f"Decoded: {ENCODED.name} -> {OUTPUT.name}")
    print(f"  Body size: {len(body_content):,} chars")


if __name__ == "__main__":
    main()
