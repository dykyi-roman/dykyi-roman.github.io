#!/usr/bin/env python3
"""Конвертирует PNG в JPEG (хорошее качество + малый размер) или WebP (ещё меньше).

Принимает один файл или папку; результат сохраняется в отдельную папку
(по умолчанию <папка_входа>/converted).

Примеры:
    python3 convert.py screenshot.png              # -> converted/screenshot.webp
    python3 convert.py . -f jpeg -q 80             # все PNG папки -> converted/*.jpg
    python3 convert.py ~/albom -f both -o ~/out    # оба формата в ~/out
"""
import argparse
import sys
from pathlib import Path

from PIL import Image

EXTENSIONS = {"jpeg": ".jpg", "webp": ".webp"}


def flatten_to_rgb(img):
    """Сплющивает прозрачность на белый фон: JPEG не поддерживает альфа-канал."""
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        img = img.convert("RGBA")
        background = Image.new("RGB", img.size, (255, 255, 255))
        background.paste(img, mask=img.getchannel("A"))
        return background
    return img.convert("RGB")


def convert_one(src, out_dir, fmt, quality):
    dst = out_dir / (src.stem + EXTENSIONS[fmt])
    with Image.open(src) as img:
        extra = {}
        icc = img.info.get("icc_profile")
        if icc:
            extra["icc_profile"] = icc
        if fmt == "jpeg":
            flatten_to_rgb(img).save(
                dst, "JPEG", quality=quality, optimize=True, progressive=True, **extra
            )
        else:
            img.save(dst, "WEBP", quality=quality, method=6, **extra)
    return dst


def human(size):
    size = float(size)
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024 or unit == "GB":
            return f"{size:.0f} {unit}" if unit == "B" else f"{size:.1f} {unit}"
        size /= 1024


def collect_pngs(path):
    if path.is_file():
        return [path]
    return sorted(
        p for p in path.iterdir() if p.is_file() and p.suffix.lower() == ".png"
    )


def main():
    parser = argparse.ArgumentParser(
        description="Конвертация PNG в JPEG/WebP с сохранением в отдельную папку"
    )
    parser.add_argument("input", help="PNG-файл или папка с PNG")
    parser.add_argument(
        "-f", "--format", choices=["jpeg", "webp", "both"], default="webp",
        help="формат результата (по умолчанию: webp)",
    )
    parser.add_argument(
        "-q", "--quality", type=int, default=85,
        help="качество 1-100 (по умолчанию: 85)",
    )
    parser.add_argument(
        "-o", "--output",
        help="папка результата (по умолчанию: <папка_входа>/converted)",
    )
    args = parser.parse_args()

    if not 1 <= args.quality <= 100:
        parser.error("качество должно быть в диапазоне 1-100")

    src = Path(args.input).expanduser()
    if not src.exists():
        sys.exit(f"Не найдено: {src}")

    files = collect_pngs(src)
    if not files:
        sys.exit(f"PNG-файлы не найдены: {src}")

    base_dir = src.parent if src.is_file() else src
    out_dir = Path(args.output).expanduser() if args.output else base_dir / "converted"
    out_dir.mkdir(parents=True, exist_ok=True)

    formats = ["jpeg", "webp"] if args.format == "both" else [args.format]
    totals = {fmt: 0 for fmt in formats}
    total_src = 0
    errors = 0

    for f in files:
        src_size = f.stat().st_size
        try:
            results = [(fmt, convert_one(f, out_dir, fmt, args.quality)) for fmt in formats]
        except Exception as e:
            errors += 1
            print(f"ОШИБКА {f.name}: {e}", file=sys.stderr)
            continue
        total_src += src_size
        parts = []
        for fmt, dst in results:
            dst_size = dst.stat().st_size
            totals[fmt] += dst_size
            saving = 100 * (1 - dst_size / src_size)
            parts.append(f"{dst.name} {human(dst_size)} (-{saving:.0f}%)")
        print(f"{f.name} {human(src_size)} -> " + "; ".join(parts))

    converted = len(files) - errors
    print(f"\nГотово: {converted} из {len(files)} файл(ов), результат в {out_dir}")
    if total_src:
        for fmt in formats:
            saving = 100 * (1 - totals[fmt] / total_src)
            print(f"  {fmt.upper():4}: {human(total_src)} -> {human(totals[fmt])} (экономия {saving:.0f}%)")


if __name__ == "__main__":
    main()
