# Recovery Checklist — INC-20260406

## Phase A: Paperclip 복구

- [x] Paperclip DB 스키마 복구 (Drizzle migration 47개 재실행)
- [x] Paperclip 서버 health 확인 (status: ok)
- [ ] Paperclip 재부트스트랩 (초기 사용자/회사 생성)
- [ ] GIT 회사 재생성 (company_id 재설정)
- [ ] 15개 에이전트 재생성
- [ ] 에이전트 org chart / reportsTo 구조 복원
- [ ] Onboarding 프로젝트 재생성
- [ ] SOKDAK 프로젝트 레코드 재생성 (runtime 연결 없이)
- [ ] Goals 재생성 (SOKDAK G1~G5 + Onboarding goals)
- [ ] Issues 재생성 (SOKDAK 46개 + 회사개선 6개)
- [ ] Routines 재생성 (6개)
- [ ] UI 접속 정상 확인

## Phase B: SOKDAK Runtime 분리

- [ ] SOKDAK docker-compose.yml 수정 (별도 container/port/volume)
- [ ] SOKDAK .env 파일 생성 (sokdak-db 전용 DATABASE_URL)
- [ ] SOKDAK docker-compose up 정상 동작 확인
- [ ] SOKDAK prisma migrate가 sokdak-db만 대상으로 하는지 확인
- [ ] Paperclip DB와 SOKDAK DB가 완전 분리인지 확인

## Phase C: 정책/문서 반영

- [ ] Product Runtime Isolation Policy 작성
- [ ] DB Migration Safety Rule 작성
- [ ] Workspace vs Runtime Boundary Rule 작성
- [ ] Dangerous Command Approval Rule 작성
- [ ] CLAUDE.md에 격리 규칙 반영
- [ ] SOKDAK runtime boundary 문서 작성

## Phase D: 기능 개발 재개 조건

- [ ] Phase A 전체 완료
- [ ] Phase B 전체 완료
- [ ] Phase C 전체 완료
- [ ] Smoke test 통과 (Paperclip + SOKDAK 별도 동작 확인)
- [ ] Phase 2 backlog 재오픈 승인
