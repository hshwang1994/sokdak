# SOKDAK 백업 및 복원 가이드

## Paperclip 제어면 백업

### 수동 백업 절차

```bash
# 1. 백업 디렉토리 생성
mkdir -p /c/projects/paperclip/backups/manual-$(date +%Y%m%d)

# 2. DB 덤프 (컨테이너 내부에서 실행)
docker exec docker-db-1 sh -c 'pg_dump -U paperclip -d paperclip -Fc -f /var/lib/postgresql/data/backup.dump'

# 3. 호스트로 복사
docker cp docker-db-1:/var/lib/postgresql/data/backup.dump ./backups/manual-$(date +%Y%m%d)/paperclip_db.dump

# 4. compose + env 복사
cp docker/docker-compose.yml ./backups/manual-$(date +%Y%m%d)/
cp docker/.env ./backups/manual-$(date +%Y%m%d)/

# 5. Instructions/Skills 백업
docker exec docker-server-1 sh -c 'tar czf /tmp/instructions.tar.gz /paperclip/instances/default/companies/fb259eb6-*/ 2>/dev/null'
docker cp docker-server-1:/tmp/instructions.tar.gz ./backups/manual-$(date +%Y%m%d)/

# 6. 크기 확인
ls -lh ./backups/manual-$(date +%Y%m%d)/
```

### 예상 파일 크기

| 파일 | 예상 크기 |
|------|----------|
| paperclip_db.dump | 500-600 KB |
| docker-compose.yml | ~1 KB |
| .env | ~200 B |
| instructions_skills.tar.gz | ~20 KB |

### 복원 절차

```bash
# 1. 기존 DB 백업 (안전망)
docker exec docker-db-1 sh -c 'pg_dump -U paperclip -d paperclip -Fc -f /var/lib/postgresql/data/pre_restore_backup.dump'

# 2. DB 복원
docker cp ./backups/manual-YYYYMMDD/paperclip_db.dump docker-db-1:/var/lib/postgresql/data/restore.dump
docker exec docker-db-1 sh -c 'pg_restore -U paperclip -d paperclip --clean --if-exists /var/lib/postgresql/data/restore.dump'

# 3. 서버 재시작
cd docker && docker compose restart server

# 4. 검증
curl -s http://localhost:3100/api/health | jq .
```

## SOKDAK 런타임 백업

### DB 백업

```bash
docker exec sokdak-db sh -c 'pg_dump -U sokdak -d sokdak -Fc -f /var/lib/postgresql/data/backup.dump'
docker cp sokdak-db:/var/lib/postgresql/data/backup.dump ./backups/sokdak_db.dump
```

### 코드 백업

```bash
cd /c/projects/sokdak
git stash  # 미커밋 변경 보존
git bundle create ./backup.bundle --all  # 전체 git 히스토리
```

## 주의사항

- Paperclip DB 백업을 SOKDAK DB에 복원하지 말 것 (역도 마찬가지)
- 복원 전 반드시 현재 상태 백업
- `.env` 파일의 시크릿은 별도 보안 관리
