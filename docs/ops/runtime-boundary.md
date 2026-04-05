# Runtime Boundary — SOKDAK

> 이 문서는 SOKDAK 프로젝트의 런타임 경계를 정의한다.
> 반드시 Paperclip (control plane)과 SOKDAK (product runtime)을 분리하여 운영한다.

---

## 경로 구분 (4가지)

| 개념 | 경로 | 용도 |
|------|------|------|
| **Repo URL** | https://github.com/hshwang1994/sokdak | Git 원격 저장소 |
| **Host canonical path** | C:\projects\sokdak | 사람이 작업하는 로컬 경로 |
| **Agent workspace path** | /paperclip/instances/.../a01ddb7e/.../_default | Paperclip 컨테이너 내 clone (코드 읽기/쓰기/push만) |
| **Product runtime path** | C:\projects\sokdak (docker-compose up) | 제품 실제 실행 경로 |

---

## 런타임 분리표

| 항목 | Paperclip | SOKDAK |
|------|-----------|--------|
| Docker Compose | docker/docker-compose.yml | C:\projects\sokdak\docker-compose.yml |
| PostgreSQL container | docker-db-1 | sokdak-db |
| PostgreSQL host port | 5432 | **5433** |
| PostgreSQL DB name | paperclip | sokdak |
| PostgreSQL user | paperclip | sokdak |
| Redis container | (없음) | sokdak-redis |
| Redis host port | - | **6380** |
| Web container | docker-server-1 | sokdak-web |
| Web host port | 3100 | 3000 |
| Volume (DB) | docker_pgdata | sokdak-pgdata |
| Volume (Redis) | - | sokdak-redis-data |
| Env file | docker/.env | C:\projects\sokdak\.env |

---

## Migration 규칙

| 규칙 | 설명 |
|------|------|
| Migration 대상 DB | **sokdak-db (port 5433)만** |
| DATABASE_URL 출처 | **C:\projects\sokdak\.env** |
| 실행 위치 | **호스트 (C:\projects\sokdak)** 또는 sokdak-web 컨테이너 |
| 절대 금지 | Paperclip 컨테이너 내부에서 prisma 명령 실행 |

### Migration 실행 방법

```bash
# 호스트에서 실행 (.env의 DATABASE_URL=sokdak-db:5433)
cd C:\projects\sokdak
npx prisma migrate dev

# 또는 compose 내에서 실행
docker compose exec web npx prisma migrate deploy
```

### 절대 금지 명령

```bash
# 이 명령들은 CTO/DevOps 승인 없이 실행 금지
npx prisma db push --force-reset
npx prisma migrate reset
DROP TABLE / DROP DATABASE
```

---

## Agent Workspace 규칙

에이전트가 SOKDAK workspace에서 할 수 있는 것:
- 코드 읽기/쓰기
- git commit / push
- npm install (코드 생성용)
- vitest 실행 (단위 테스트)

에이전트가 SOKDAK workspace에서 할 수 없는 것:
- prisma db push / migrate
- docker compose up/down
- seed 실행
- DB 직접 접근
- 환경변수에 의존하는 인프라 명령

---

## Smoke Test

SOKDAK 분리 런타임 검증:

```bash
# 1. Paperclip이 떠 있는 상태에서 SOKDAK compose up
cd C:\projects\sokdak
docker compose up -d

# 2. 두 DB가 분리되어 있는지 확인
docker exec sokdak-db psql -U sokdak -d sokdak -c "\dt"
docker exec docker-db-1 psql -U paperclip -d paperclip -c "\dt"

# 3. port 충돌 없는지 확인
curl http://localhost:3100/api/health  # Paperclip
curl http://localhost:3000/api/health  # SOKDAK

# 4. SOKDAK migration이 sokdak DB만 변경하는지 확인
cd C:\projects\sokdak
npx prisma migrate dev --name test
docker exec docker-db-1 psql -U paperclip -d paperclip -c "\dt"  # 변경 없어야 함
```
