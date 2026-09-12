#!/usr/bin/env bash
# 로컬 PostgreSQL(Docker) + Alembic 운영 스크립트. Claude 스킬 `/db` 와 사람이 같이 쓴다.
# 사용법: bash scripts/db.sh [up|status|migrate "<메시지>"|reset --yes|down|logs [N]|sql "<query>"]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker/docker-compose.yml"
SERVICE=db
PG_USER=bazi
PG_DB=bazi
WAIT_SECONDS=60

log()  { printf '▶ %s\n' "$*"; }
ok()   { printf '✔ %s\n' "$*"; }
warn() { printf '⚠ %s\n' "$*" >&2; }
die()  { printf '✖ %s\n' "$*" >&2; exit 1; }

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$COMPOSE_FILE" "$@"
  else
    die "docker compose 플러그인도 docker-compose 바이너리도 없습니다. brew install docker-compose"
  fi
}

run_alembic() { (cd "$ROOT" && uv run alembic "$@"); }

docker_alive() { docker info >/dev/null 2>&1; }

ensure_docker() {
  docker_alive && return 0
  if command -v colima >/dev/null 2>&1; then
    log "Docker 데몬이 꺼져 있어 colima start 실행"
    colima start
    docker_alive || die "colima는 시작됐지만 docker 소켓에 연결할 수 없습니다 (docker context ls 확인)"
  else
    die "Docker 데몬에 연결할 수 없습니다. Colima·OrbStack·Docker Desktop 중 하나를 시작하세요."
  fi
}

container_id() { compose ps -q "$SERVICE" 2>/dev/null || true; }

wait_healthy() {
  local cid status=""
  log "PostgreSQL 준비 대기 (최대 ${WAIT_SECONDS}s)"
  for ((i = 0; i < WAIT_SECONDS; i++)); do
    cid="$(container_id)"
    if [[ -n "$cid" ]]; then
      status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || true)"
      [[ "$status" == "healthy" ]] && { ok "DB healthy"; return 0; }
      [[ "$status" == "exited" || "$status" == "dead" ]] && break
    fi
    sleep 1
  done
  warn "DB가 준비되지 않았습니다 (status=${status:-unknown}). 최근 로그:"
  compose logs --tail 30 "$SERVICE" >&2 || true
  exit 1
}

current_rev() { run_alembic current 2>/dev/null | tail -1; }
head_rev()    { run_alembic heads 2>/dev/null | tail -1; }

check_drift() {
  local out
  if out="$(run_alembic check 2>&1)"; then
    ok "모델과 마이그레이션 일치 (alembic check)"
    return 0
  fi
  warn "모델 변경이 마이그레이션에 반영되지 않았습니다:"
  printf '%s\n' "$out" | grep -v "^INFO" | tail -8 >&2
  warn "새 리비전: bash scripts/db.sh migrate \"<메시지>\"  /  모델 쪽 문제면 models.py 수정"
  return 1
}

cmd_up() {
  ensure_docker
  log "PostgreSQL 컨테이너 기동"
  compose up -d
  wait_healthy
  log "Alembic 마이그레이션 적용"
  run_alembic upgrade head
  ok "현재 리비전: $(current_rev)"
  check_drift || true
}

cmd_status() {
  docker_alive || die "Docker 데몬이 꺼져 있습니다 (bash scripts/db.sh up 으로 기동)"
  compose ps
  [[ -n "$(container_id)" ]] || die "DB 컨테이너가 없습니다 (bash scripts/db.sh up)"
  log "리비전: $(current_rev)  /  head: $(head_rev)"
  check_drift || true
}

cmd_migrate() {
  local msg="${1:-}"
  [[ -n "$msg" ]] || die "사용법: bash scripts/db.sh migrate \"<리비전 메시지>\""
  ensure_docker
  [[ -n "$(container_id)" ]] || compose up -d
  wait_healthy
  run_alembic upgrade head
  if run_alembic check >/dev/null 2>&1; then
    ok "모델과 DB가 이미 일치합니다 — 생성할 리비전이 없습니다"
    return 0
  fi
  log "모델 diff로 리비전 생성: $msg"
  run_alembic revision --autogenerate -m "$msg"
  local newest
  newest="$(ls -t "$ROOT"/alembic/versions/*.py | head -1)"
  ok "생성됨: ${newest#"$ROOT"/}"
  warn "autogenerate는 rename(drop+add로 나옴)·타입 미세 변경·server_default·partial index를 놓칠 수 있습니다."
  warn "파일을 검토한 뒤 적용: bash scripts/db.sh up"
}

cmd_reset() {
  [[ "${1:-}" == "--yes" ]] || die "로컬 데이터 볼륨을 전부 삭제합니다. 확인했다면: bash scripts/db.sh reset --yes"
  ensure_docker
  log "컨테이너·볼륨 삭제"
  compose down -v
  cmd_up
}

cmd_down() {
  docker_alive || { ok "Docker 데몬이 이미 꺼져 있습니다"; return 0; }
  compose down
  ok "컨테이너 중지 (데이터 볼륨 유지)"
}

cmd_logs() {
  ensure_docker
  compose logs --tail "${1:-50}" "$SERVICE"
}

cmd_sql() {
  local q="${1:-}"
  [[ -n "$q" ]] || die "사용법: bash scripts/db.sh sql \"SELECT ...\""
  ensure_docker
  compose exec -T "$SERVICE" psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 -c "$q"
}

usage() {
  cat <<USAGE
사용법: bash scripts/db.sh <command>
  up                  Docker(Colima) 확인 → PostgreSQL 기동 → healthy 대기 → alembic upgrade head → 드리프트 점검
  status              컨테이너 상태 · 현재/최신 리비전 · 드리프트 점검
  migrate "<메시지>"   모델 변경을 autogenerate 리비전으로 생성 (적용은 하지 않음)
  reset --yes         컨테이너·데이터 볼륨 삭제 후 up  (⚠ 로컬 데이터 전부 삭제)
  down                컨테이너 중지 (볼륨 유지)
  logs [N]            DB 로그 마지막 N줄 (기본 50)
  sql "<query>"       psql로 단일 쿼리 실행
USAGE
}

case "${1:-up}" in
  up)      cmd_up ;;
  status)  cmd_status ;;
  migrate) shift; cmd_migrate "$@" ;;
  reset)   shift; cmd_reset "$@" ;;
  down)    cmd_down ;;
  logs)    shift; cmd_logs "$@" ;;
  sql)     shift; cmd_sql "$@" ;;
  -h|--help|help) usage ;;
  *) usage; die "알 수 없는 명령: $1" ;;
esac
