#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re
import sys


TYPE_IGNORE_PATTERN = re.compile(r"#\s*type:\s*ignore\b")


def load_allowlist(path: Path) -> set[str]:
    if not path.exists():
        return set()

    entries: set[str] = set()
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        entries.add(line)
    return entries


def main() -> int:
    repo_root = Path(__file__).resolve().parents[2]
    agents_root = repo_root / "agents"
    allowlist = load_allowlist(repo_root / "scripts" / "ci" / "type-ignore-allowlist.txt")

    violations: list[str] = []
    for python_file in agents_root.rglob("*.py"):
        rel_path = python_file.relative_to(repo_root).as_posix()
        for line_number, line in enumerate(
            python_file.read_text(encoding="utf-8").splitlines(),
            start=1
        ):
            if TYPE_IGNORE_PATTERN.search(line):
                marker = f"{rel_path}:{line_number}"
                if marker not in allowlist:
                    violations.append(marker)

    if violations:
        print("Blocking failure: unapproved '# type: ignore' comments found:")
        for violation in violations:
            print(f" - {violation}")
        print(
            "Approve intentionally by adding exact file:line entries to "
            "scripts/ci/type-ignore-allowlist.txt."
        )
        return 1

    print("Type-ignore allowlist check passed: no unapproved '# type: ignore' comments in agents/.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
