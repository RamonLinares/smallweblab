#!/usr/bin/env python3

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
LAB_ROOT = REPO_ROOT / "lab"
CATALOG_PATH = LAB_ROOT / "catalog.json"
SITEMAP_PATH = REPO_ROOT / "sitemap.xml"
SITE_ROOT_URL = "https://smallweblab.com"
IGNORE_PATTERNS = shutil.ignore_patterns(
    ".git",
    ".github",
    ".DS_Store",
    ".gitignore",
    ".vscode",
    ".idea",
    "node_modules",
)


def run(*args: str, cwd: Path | None = None) -> None:
    subprocess.run(args, cwd=cwd, check=True)


def remove_path(path: Path) -> None:
    if path.is_dir():
        shutil.rmtree(path)
    elif path.exists():
        path.unlink()


def load_sources() -> list[dict[str, str]]:
    try:
        raw = CATALOG_PATH.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise SystemExit(f"Missing prototype catalog: {CATALOG_PATH}") from exc

    catalog = json.loads(raw)
    if not isinstance(catalog, list):
        raise SystemExit(f"Prototype catalog must be a list: {CATALOG_PATH}")

    return catalog


def build_sitemap(catalog: list[dict[str, object]]) -> str:
    urls = [f"{SITE_ROOT_URL}/"]

    for entry in catalog:
        path = str(entry.get("path", "")).strip()
        if not path.startswith("/"):
            continue
        urls.append(f"{SITE_ROOT_URL}{path}")

    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url in urls:
        lines.append("  <url>")
        lines.append(f"    <loc>{url}</loc>")
        lines.append("  </url>")
    lines.append("</urlset>")
    lines.append("")
    return "\n".join(lines)


def sync_source(entry: dict[str, object]) -> None:
    slug = str(entry["slug"])
    sync = entry.get("sync")
    if not isinstance(sync, dict):
        print(f"Skipping {slug}: no sync source configured")
        return

    repo = str(sync["repo"])
    ref = str(sync.get("ref", "main"))
    source = str(sync.get("source", "."))

    print(f"Syncing {slug} from {repo}@{ref}")

    with tempfile.TemporaryDirectory(prefix=f"sync-{slug}-") as temp_dir:
        checkout_dir = Path(temp_dir) / "source"
        run("git", "clone", "--depth", "1", "--branch", ref, repo, str(checkout_dir))

        source_path = (checkout_dir / source).resolve()
        checkout_root = checkout_dir.resolve()
        if checkout_root not in [source_path, *source_path.parents]:
            raise SystemExit(f"Source path escapes checkout for {slug}: {source}")
        if not source_path.exists():
            raise SystemExit(f"Missing source path for {slug}: {source}")

        target_path = LAB_ROOT / slug
        remove_path(target_path)
        shutil.copytree(source_path, target_path, ignore=IGNORE_PATTERNS)


def main() -> int:
    LAB_ROOT.mkdir(exist_ok=True)

    catalog = load_sources()

    for source in catalog:
        sync_source(source)

    SITEMAP_PATH.write_text(build_sitemap(catalog), encoding="utf-8")

    return 0


if __name__ == "__main__":
    sys.exit(main())
