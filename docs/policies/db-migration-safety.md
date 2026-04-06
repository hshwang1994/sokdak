# DB Migration 안전 정책

> 적용 범위: SOKDAK 및 GIT 회사 산하 모든 제품

## 원칙

1. **Paperclip DB에는 절대 제품 migration을 실행하지 않는다**
2. 모든 migration은 해당 제품의 전용 DB 컨테이너에서만 실행한다
3. Migration 전 반드시 백업을 수행한다

## 안전 체크리스트

### Migration 실행 전

- [ ] `DATABASE_URL`이 제품 전용 DB를 가리키는지 확인
- [ ] Paperclip DB URL(`localhost:5432/paperclip`)이 **아닌지** 확인
- [ ] 현재 디렉토리가 제품 레포인지 확인 (`pwd` → `/c/projects/sokdak`)
- [ ] `.env` 파일의 DB 포트가 제품 전용 포트인지 확인 (SOKDAK: 5433)
- [ ] DB 백업 완료 확인

### Migration 실행 후

- [ ] 새 테이블/컬럼이 정상 생성되었는지 확인
- [ ] 기존 데이터 손실 없는지 확인
- [ ] 애플리케이션 정상 기동 확인

## 위험 명령어 (CTO 승인 필수)

| 명령어 | 위험도 | 사유 |
|--------|--------|------|
| `prisma migrate reset` | CRITICAL | 전체 DB 삭제 후 재생성 |
| `prisma db push --force-reset` | CRITICAL | 스키마 강제 덮어쓰기 |
| `DROP DATABASE` | CRITICAL | DB 완전 삭제 |
| `DROP TABLE` | HIGH | 테이블 삭제 |
| `prisma migrate deploy` | MEDIUM | 프로덕션 migration |

## Agent 규칙

- Agent workspace에서 `prisma migrate`/`prisma db push` **실행 금지**
- Migration은 반드시 DevOps Lead 또는 Backend Lead가 전용 환경에서 실행
- Agent가 migration 파일을 생성(코드 작성)하는 것은 허용
