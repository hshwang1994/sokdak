# Product Runtime Isolation Policy

> Effective: 2026-04-06
> Triggered by: INC-20260406 (Paperclip DB overwrite)
> Scope: GIT 회사 전체, 모든 제품 프로젝트

---

## 1. Paperclip은 Control Plane이다

Paperclip은 아래만 관리한다:
- 회사 (company)
- 에이전트 (agent)
- 프로젝트 레코드 (project record)
- 목표 (goal)
- 이슈 (issue)
- 루틴 (routine)
- 승인 (approval)
- 활동 로그 (activity)

**Paperclip은 제품 런타임을 담는 곳이 아니다.**

Paperclip에 프로젝트를 만든다 = 관리 레코드를 만든다.
Paperclip에 프로젝트를 만든다 != 제품 컨테이너/DB를 Paperclip 내부에서 실행한다.

---

## 2. 모든 제품은 Separate Runtime이다

SOKDAK, ClovirONE 등 모든 제품은 반드시 아래를 Paperclip과 분리:

| 항목 | Paperclip | SOKDAK | ClovirONE |
|------|-----------|--------|-----------|
| Docker Compose | docker/ | C:\projects\sokdak/ | C:\projects\clovirone/ |
| PostgreSQL | docker-db-1:5432 | sokdak-db:5433 | clovirone-db:5434 |
| Redis | (없음) | sokdak-redis:6380 | clovirone-redis:6381 |
| DB name | paperclip | sokdak | clovirone |
| Volume | docker_pgdata | sokdak-pgdata | clovirone-pgdata |
| Container prefix | docker- | sokdak- | clovirone- |
| Network | docker_default | sokdak_default | clovirone_default |
| Env file | docker/.env | C:\projects\sokdak\.env | C:\projects\clovirone\.env |
| Web port | 3100 | 3000 | 3200 |

---

## 3. 절대 금지 사항

1. Paperclip DB에 제품 Prisma/Drizzle migration 실행 금지
2. Paperclip DB에 제품 테이블 생성 금지
3. Paperclip compose 내부에 제품 서비스 추가 금지
4. Paperclip env를 제품 코드에서 재사용 금지
5. Paperclip volume을 제품 runtime에서 재사용 금지
6. 제품 코드 실행 전 target DB/volume/network 확인 없이 진행 금지

---

## 4. DB Migration Safety Rule

### 금지 명령 (CTO 또는 DevOps Lead 승인 필요)

| 명령 | 위험도 | 승인 필요 |
|------|--------|----------|
| `prisma db push` | Critical | 필수 |
| `prisma db push --force-reset` | Critical | 필수 |
| `prisma migrate reset` | Critical | 필수 |
| `prisma migrate deploy` | High | 필수 |
| `drizzle-kit push` | Critical | 필수 |
| `drizzle-kit drop` | Critical | 필수 |
| `DROP TABLE` | Critical | 필수 |
| `DROP DATABASE` | Critical | 필수 |
| `docker compose down -v` | High | 필수 |

### Migration 실행 전 필수 확인

1. 현재 어떤 DB를 대상으로 하는가?
2. DATABASE_URL이 어디서 오는가? (.env? 환경변수? 기본값?)
3. 해당 DB가 제품 전용 DB인가, Paperclip DB인가?
4. .env 파일이 존재하고, 올바른 URL을 가리키는가?
5. 이 명령이 파괴적(destructive)인가?

---

## 5. Workspace vs Runtime Boundary Rule

### 4가지 경로 구분

| 개념 | 설명 | 예시 (SOKDAK) |
|------|------|-------------|
| Repo URL | Git 원격 저장소 | https://github.com/hshwang1994/sokdak |
| Host canonical path | 사람이 작업하는 로컬 경로 | C:\projects\sokdak |
| Agent workspace path | Paperclip 컨테이너 내 clone 경로 | /paperclip/instances/.../a01ddb7e/.../_default |
| Product runtime path | 제품이 실제 실행되는 경로 | C:\projects\sokdak (host docker-compose up) |

### 규칙

- Agent workspace에서는 코드 읽기/쓰기/commit/push만 수행
- Agent workspace에서 DB migration, docker compose, seed 실행 금지
- Product runtime은 항상 호스트에서 별도 compose로 실행
- Migration은 항상 product runtime DB를 대상으로 실행

---

## 6. Product Env Isolation Checklist

제품 프로젝트 생성 시 필수 체크:

- [ ] 별도 docker-compose.yml 존재
- [ ] 별도 PostgreSQL 컨테이너 (다른 port, 다른 container name)
- [ ] 별도 Redis 컨테이너 (다른 port)
- [ ] .env 파일의 DATABASE_URL이 제품 전용 DB를 가리킴
- [ ] DATABASE_URL이 Paperclip DB URL과 절대 동일하지 않음
- [ ] container name prefix가 Paperclip(docker-)과 다름
- [ ] volume name이 Paperclip(docker_pgdata)과 다름
- [ ] network가 Paperclip과 분리됨
- [ ] .env.example에 올바른 제품 DB URL 예시 포함
- [ ] CLAUDE.md에 runtime boundary 명시

---

## 7. Separate Compose / DB Naming Standard

### Naming Convention

```
{product}-{service}

예:
  sokdak-db       (PostgreSQL)
  sokdak-redis    (Redis)
  sokdak-web      (Next.js app)
  sokdak-worker   (Background worker)
```

### Port Allocation

| 서비스 | Paperclip | SOKDAK | ClovirONE | 예비 |
|--------|-----------|--------|-----------|------|
| Web | 3100 | 3000 | 3200 | 3300+ |
| PostgreSQL | 5432 | 5433 | 5434 | 5435+ |
| Redis | - | 6380 | 6381 | 6382+ |
| Monitoring | 3001,9090 | - | - | - |

### Volume Naming

```
{product}-pgdata
{product}-redis-data

예:
  sokdak-pgdata
  sokdak-redis-data
```
