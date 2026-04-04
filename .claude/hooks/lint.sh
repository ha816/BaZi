#!/bin/bash
# PostToolUse hook: Python 파일 수정 시 자동 린트
# Claude가 파일을 수정하면 즉시 실행 → 오류 발견 시 자동 수정 루프

FILE="$1"

# Python 파일만 처리
if [[ "$FILE" != *.py ]]; then
  exit 0
fi

# 파일이 src/ 또는 tests/ 하위인 경우만
if [[ "$FILE" != */src/* ]] && [[ "$FILE" != */tests/* ]]; then
  exit 0
fi

cd /Users/seungmin/Workspace/Service/BaZi

# ruff 린트 + 자동 수정
uv run ruff check --fix "$FILE" 2>&1
LINT_EXIT=$?

# ruff 포맷
uv run ruff format "$FILE" 2>&1

if [ $LINT_EXIT -ne 0 ]; then
  echo "::error::ruff lint failed on $FILE"
  exit 1
fi
