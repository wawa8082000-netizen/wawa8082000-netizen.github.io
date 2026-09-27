"""Generate clue pages; local image addresses are relative to docs/."""
import os
from pathlib import Path
from urllib.parse import quote, urlsplit

import pandas as pd
from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parents[1]


def image_url(value, page, docs):
    if not value:
        return ""
    parsed = urlsplit(value)
    if parsed.scheme:
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError(f"图片地址只支持 http/https 或 docs 内的相对路径: {value}")
        return value
    if parsed.netloc or parsed.query or parsed.fragment:
        raise ValueError(f"无效的本地图片地址: {value}")
    target = (docs / value).resolve()
    if not target.is_relative_to(docs.resolve()) or not target.is_file():
        raise ValueError(f"图片不存在或不在 docs 内: {value}")
    return quote(os.path.relpath(target, page.parent.resolve()), safe="/")


def build(root=ROOT):
    docs = root / "docs"
    env = Environment(loader=FileSystemLoader(root), autoescape=select_autoescape(["html"]))
    template = env.get_template("template.html")
    pages = {}
    for name, df in pd.read_excel(root / "info.xlsx", sheet_name=None, keep_default_na=False).items():
        if not {"网址", "提示词"}.issubset(df.columns):
            raise ValueError(f"工作表 {name} 缺少网址或提示词列")
        for _, row in df.iterrows():
            slug = str(row["网址"]).strip()
            prompt = str(row["提示词"])
            picture = str(row.get("图片地址", "")).strip()
            if not slug and not prompt and not picture:
                continue
            if not slug or Path(slug).name != slug or slug in {".", ".."}:
                raise ValueError(f"无效的网址: {slug}")
            page = docs / name.replace("/", "") / Path(slug).with_suffix(".html")
            if not page.resolve().is_relative_to(docs.resolve()) or page in pages:
                raise ValueError(f"重复或无效的输出路径: {page}")
            pages[page] = template.render(prompt=prompt, image_url=image_url(picture, page, docs))
            # Existing QR codes use the original chapter directory.
            if name == "1碑影迷踪":
                legacy = docs / "1隐秘的见证" / page.name
                pages[legacy] = pages[page]
    # Validate all rows first and preserve static assets on regeneration.
    docs.mkdir(exist_ok=True)
    for page, content in pages.items():
        page.parent.mkdir(parents=True, exist_ok=True)
        page.write_text(content, encoding="utf-8")
    for stale in docs.rglob("*.html"):
        if stale not in pages:
            stale.unlink()
    print(f"Generated {len(pages)} pages")


if __name__ == "__main__":
    build()
