# SOKDAK Local Runtime Guide

## 사전 조건

- Docker Desktop 실행 중
- Paperclip이 이미 실행 중 (port 5432, 3100 사용 중)
- SOKDAK은 별도 port 사용 (5433, 6380, 3000)

## 빠른 시작

```bash
# 1. 프로젝트 디렉터리 이동
cd C:\projects\sokdak

# 2. .env 파일 확인 (반드시 port 5433, 6380)
cat .env | grep -E "DATABASE_URL|REDIS_URL"
# 출력 확인:
#   DATABASE_URL="postgresql://sokdak:sokdak_dev@localhost:5433/sokdak?schema=public"
#   REDIS_URL="redis://localhost:6380"

# 3. 인프라 시작 (DB + Redis만)
docker compose up -d db redis

# 4. DB 정상 확인
docker exec sokdak-db psql -U sokdak -d sokdak -c "SELECT 1"

# 5. Prisma migration 실행 (sokdak-db 전용)
npx prisma migrate dev

# 6. Seed 실행
npx tsx prisma/seed.ts

# 7. 개발 서버 시작 (로컬)
npm run dev
```

## Port 할당

| 서비스 | SOKDAK Port | Paperclip Port | 충돌 여부 |
|--------|-------------|----------------|----------|
| PostgreSQL | **5433** | 5432 | 없음 |
| Redis | **6380** | - | 없음 |
| Web | **3000** | 3100 | 없음 |
| Prometheus | - | 9090 | 없음 |
| Grafana | - | 3001 | 없음 |

## 주의사항

1. **DATABASE_URL이 port 5433을 가리키는지 반드시 확인**
   - 5432는 Paperclip DB (docker-db-1)
   - 5433은 SOKDAK DB (sokdak-db)

2. **prisma 명령 실행 전 .env 확인**
   ```bash
   grep DATABASE_URL .env
   # 반드시 localhost:5433/sokdak 이어야 함
   ```

3. **docker compose down -v 실행 시 SOKDAK 데이터만 삭제됨**
   - Paperclip 데이터에는 영향 없음 (별도 volume)

4. **Paperclip 컨테이너 안에서 prisma 명령 절대 금지**

## 문제 해결

### Port 충돌
```bash
# 어떤 프로세스가 port를 사용 중인지 확인
netstat -ano | findstr :5433
netstat -ano | findstr :6380
```

### DB 연결 실패
```bash
# sokdak-db 컨테이너 상태 확인
docker ps | grep sokdak-db
docker logs sokdak-db
```

### Migration 대상 확인
```bash
# 현재 DATABASE_URL이 어디를 가리키는지 확인
npx prisma db execute --stdin <<< "SELECT current_database(), inet_server_port()"
# 출력: sokdak | 5432 (컨테이너 내부 port)
```
