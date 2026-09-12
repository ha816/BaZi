---
name: db
description: 로컬 PostgreSQL(Docker/Colima) 기동, Alembic 마이그레이션 적용·생성, DB 상태·드리프트 점검, 초기화. "DB 올려줘", "마이그레이션 적용해", "models.py 바꿨으니 리비전 만들어", "DB 초기화", "테이블 확인" 요청에 사용.
argument-hint: "[up|status|migrate <메시지>|reset|down|logs|sql <query>]"
allowed-tools: Bash(bash ${CLAUDE_PROJECT_DIR}/scripts/db.sh *), Bash(bash scripts/db.sh *), Bash(uv run alembic *), Bash(docker *), Bash(docker-compose *), Bash(colima *), Bash(lsof *), Read, Grep
---

# 로컬 DB 운영 (Docker + Alembic)

실제 작업은 `scripts/db.sh`가 한다. 이 스킬은 어떤 서브커맨드를 고르고, 실패를 어떻게 해석하고, 언제 사용자 확인을 받는지 정한다.
Alembic은 이 프로젝트의 마이그레이션 도구로 유지한다 (SQLAlchemy 모델 diff → autogenerate). 다른 도구로 바꾸지 않는다.

## 현재 상태 (스킬 호출 시점)

```!
bash ${CLAUDE_PROJECT_DIR}/scripts/db.sh status 2>&1 || true
```

## 요청 → 명령

인자(`$ARGUMENTS`)가 있으면 그대로 서브커맨드로 넘긴다. 없으면 사용자 의도에 따라 고른다.

| 의도 | 실행 |
|------|------|
| DB 올려줘 · 마이그레이션 적용 · 서버 띄우기 전 준비 | `bash ${CLAUDE_PROJECT_DIR}/scripts/db.sh up` |
| 상태 · 리비전 확인 | `bash ${CLAUDE_PROJECT_DIR}/scripts/db.sh status` |
| models.py 바꿨어 · 리비전 만들어 | `bash ${CLAUDE_PROJECT_DIR}/scripts/db.sh migrate "<snake_case 메시지>"` → 생성된 파일을 Read로 검토 → 이상 없으면 `up`으로 적용 |
| DB 초기화 · 데이터 지우고 다시 | **사용자가 이 대화에서 명시적으로 요청했을 때만** `bash ${CLAUDE_PROJECT_DIR}/scripts/db.sh reset --yes` |
| DB 내려 | `bash ${CLAUDE_PROJECT_DIR}/scripts/db.sh down` |
| 테이블·데이터 보고 싶어 | `bash ${CLAUDE_PROJECT_DIR}/scripts/db.sh sql "SELECT ..."` (`\dt`, `\d members` 같은 psql 메타명령도 됨) |
| DB 로그 | `bash ${CLAUDE_PROJECT_DIR}/scripts/db.sh logs 100` |

`up`은 Docker 데몬이 꺼져 있으면 `colima start`를 자동 실행한다(1~2분). 그 사이 사용자에게 기다리라고 알린다.

## 판단 규칙

1. **reset은 파괴적이다.** 스크립트는 `--yes` 없이 거부한다. analyses·fortunes·compatibilities는 재계산 가능한 캐시지만 members·profiles·interpret_feedbacks·payments는 복구 불가. 사용자가 "초기화"를 직접 말하지 않았으면 먼저 물어본다.
2. **autogenerate 결과는 반드시 읽는다.** rename은 `drop_*` + `add_*`로 나오고, `SmallInteger`↔`Integer` 같은 타입 미세 diff·`server_default`·partial index는 누락되거나 잡음이 될 수 있다. `drop_table`/`drop_column`/`drop_index`가 보이면 의도된 것인지 사용자에게 확인한다.
3. **이미 적용된 리비전 파일은 수정하지 않는다.** 스키마를 고치려면 새 리비전을 만든다. 예외는 `downgrade()`만 고치는 경우.
4. **드리프트 경고**(`⚠ 모델 변경이 마이그레이션에 반영되지 않았습니다`)가 나오면 `uv run alembic check` 출력을 보고 방향을 정한다.
   - `remove_index` / `remove_column` 이 나오면 DB에는 있는데 모델에 선언이 없는 것 → 보통 **models.py를 고치는 쪽**이 맞다.
   - `add_column` / `add_table` 이 나오면 모델이 앞선 것 → **리비전 생성**이 맞다.
   결정 근거를 사용자에게 한 줄로 알린다.
5. **DB URL 출처는 하나다.** `KKACHI_DB_URL` env → `src/kkachi/resource/local.toml [db].url` → 기본값. 앱(`fastapi.py`)과 Alembic(`alembic/env.py`)이 같은 순서를 쓴다. `local.toml`의 값은 수정하지 않는다.
6. 마이그레이션 실패로 DB가 중간 상태가 되면 `sql "SELECT version_num FROM alembic_version"` 로 실제 리비전을 확인한 뒤 `alembic history` 와 대조한다. 임의로 `alembic stamp` 하지 않는다.

## 실패 해석

| 증상 | 원인 → 조치 |
|------|------------|
| `Docker 데몬에 연결할 수 없습니다` (colima 없음) | OrbStack/Docker Desktop을 사용자가 켜야 한다 |
| `docker compose 플러그인도 docker-compose 바이너리도 없습니다` | `brew install docker-compose`. 이 머신은 `docker compose` 플러그인 없이 `docker-compose` 바이너리를 쓴다 |
| `port is already allocated` / `address already in use` | `lsof -i :5432` 로 점유 프로세스(Postgres.app, 다른 컨테이너) 확인 → 사용자에게 알리고 종료 여부 확인 |
| healthy 대기 실패 + 로그 `database files are incompatible with server` | 볼륨의 PG 메이저 버전 불일치 → reset 필요 (사용자 확인) |
| `Target database is not up to date` | `up` 으로 head 적용 후 재시도 |
| `Can't locate revision identified by '…'` | DB의 alembic_version이 로컬 `alembic/versions`에 없는 리비전 (브랜치 전환·파일 삭제) → history와 대조 후 사용자와 상의 |
| asyncpg `Connection refused` (컨테이너는 healthy) | `docker ps` 포트 매핑과 `local.toml` URL의 호스트·포트 대조 |
| `colima start` 실패 | `colima status`, `colima list` 로 프로필 확인. 프로필 설정을 임의로 바꾸지 않는다 |

## 완료 보고

마지막에 반드시 요약한다: 컨테이너 상태, 현재 리비전이 head인지, 드리프트 유무, 파괴적 작업(reset) 실행 여부. 새 리비전을 만들었으면 파일 경로와 upgrade/downgrade 한 줄 요약을 적는다.
