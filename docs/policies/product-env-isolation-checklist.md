# 제품 환경 격리 체크리스트

> 새 제품 런타임 생성 또는 기존 제품 환경 점검 시 사용

## SOKDAK 환경 명세

| 리소스 | 값 | Paperclip과 충돌 여부 |
|--------|------|---------------------|
| PostgreSQL 포트 | 5433 | ✅ 충돌 없음 (Paperclip: 5432) |
| Redis 포트 | 6380 | ✅ 충돌 없음 |
| Web 포트 | 3000 | ✅ 충돌 없음 (Paperclip: 3100) |
| DB 이름 | sokdak | ✅ 충돌 없음 (Paperclip: paperclip) |
| Docker 볼륨 | sokdak-pgdata | ✅ 충돌 없음 (Paperclip: docker_pgdata) |
| 네트워크 | sokdak-net | ✅ 충돌 없음 |
| 컨테이너 prefix | sokdak- | ✅ 충돌 없음 (Paperclip: docker-) |

## 격리 점검 항목

### 1. 포트 격리

- [ ] DB 포트가 Paperclip(5432)과 다른지 확인
- [ ] Redis 포트가 기존 서비스와 겹치지 않는지 확인
- [ ] Web 포트가 Paperclip(3100)과 다른지 확인

### 2. 데이터 격리

- [ ] Docker 볼륨 이름이 고유한지 확인
- [ ] DATABASE_URL이 제품 전용 DB를 가리키는지 확인
- [ ] Redis URL이 제품 전용 인스턴스를 가리키는지 확인

### 3. 네트워크 격리

- [ ] Docker 네트워크가 Paperclip과 분리되어 있는지 확인
- [ ] 제품 컨테이너에서 Paperclip DB에 접근 불가능한지 확인

### 4. 설정 파일 격리

- [ ] `.env` 파일이 제품 전용 디렉토리에 있는지 확인
- [ ] `docker-compose.yml`이 제품 전용인지 확인
- [ ] Prisma schema가 제품 전용 DB를 참조하는지 확인

### 5. CI/CD 격리

- [ ] GitHub Actions가 제품 전용 secrets를 사용하는지 확인
- [ ] 배포 파이프라인이 Paperclip과 분리되어 있는지 확인
