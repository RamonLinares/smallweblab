#!/usr/bin/env python3

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = REPO_ROOT / ".github" / "prototype-sources.json"
LAB_ROOT = REPO_ROOT / "lab"
IGNORE_PATTERNS = shutil.ignore_patterns(
    ".git",
    ".github",
    ".DS_Store",
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
        raw = CONFIG_PATH.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise SystemExit(f"Missing prototype source config: {CONFIG_PATH}") from exc

    sources = json.loads(raw)
    if not isinstance(sources, list):
        raise SystemExit(f"Prototype source config must be a list: {CONFIG_PATH}")

    return sources


def sync_source(entry: dict[str, str]) -> None:
    slug = entry["slug"]
    repo = entry["repo"]
    ref = entry.get("ref", "main")
    source = entry.get("source", ".")

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

    for source in load_sources():
        sync_source(source)

    return 0


if __name__ == "__main__":
    sys.exit(main())
