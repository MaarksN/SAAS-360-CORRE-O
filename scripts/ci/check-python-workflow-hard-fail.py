#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re
import sys


HARD_FAIL_PATTERNS = (
    re.compile(r"\bmypy\b[^\n]*\|\|\s*true", re.IGNORECASE),
    re.compile(r"\bpytest\b[^\n]*\|\|\s*true", re.IGNORECASE),
    re.compile(r"\bruff\b[^\n]*\|\|\s*true", re.IGNORECASE),
    re.compile(r"\bflake8\b[^\n]*\|\|\s*true", re.IGNORECASE),
)


def main() -> int:
    repo_root = Path(__file__).resolve().parents[2]
    workflows_dir = repo_root / ".github" / "workflows"
    violations: list[str] = []

    for workflow_file in workflows_dir.glob("*.yml"):
        content = workflow_file.read_text(encoding="utf-8")
        for pattern in HARD_FAIL_PATTERNS:
            for match in pattern.finditer(content):
                line_number = content.count("\n", 0, match.start()) + 1
                violations.append(f"{workflow_file.as_posix()}:{line_number}: {match.group(0).strip()}")

    if violations:
        print("Blocking failure: detected tolerant Python checks ('|| true') in workflow commands:")
        for violation in violations:
            print(f" - {violation}")
        return 1

    print("Python workflow hard-fail check passed: no tolerant '|| true' patterns found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
