# ADR-001: 인증 모델 변경 (join_code → 이메일 OTP)

## 상태

**Proposed** (2026-04-06)

## 맥락

기존 SOKDAK 인증 모델은 `join_code`(초대 코드) 방식이었다:
- admin이 코드를 발급하고, 사용자가 가입 시 입력
- 코드 유출 시 외부인 가입 가능
- 코드 관리 부담 (발급, 만료, 추적)

## 결정

**회사 도메인 이메일 OTP 방식으로 변경한다.**

### 가입 플로우

```
1. 이메일 입력 (예: hong@goodmit.co.kr)
2. 허용 도메인 확인 (goodmit.co.kr)
3. OTP 발송 (6자리, 5분 유효)
4. OTP 입력 및 확인
5. 닉네임 + 비밀번호 설정
6. 계정 생성 완료
```

### 이메일 처리 원칙

- 이메일은 **가입 검증 용도로만** 사용
- DB에는 이메일 해시(SHA-256)만 저장 (중복 가입 방지)
- 원본 이메일은 저장하지 않음
- UI에 이메일 절대 노출 안 됨
- 이메일로 알림/뉴스레터 발송 안 함

### 허용 도메인 관리

```
기본값: goodmit.co.kr
admin 설정: 허용 도메인 추가/삭제 가능
```

- `super_admin`만 도메인 관리 가능
- 와일드카드 불가 (정확한 도메인 매칭)
- 도메인 목록은 시스템 설정에 저장

## 기존 모델과 비교

| 항목 | join_code (기존) | 이메일 OTP (신규) |
|------|-----------------|------------------|
| 보안 | 코드 유출 위험 | 도메인 기반 검증 |
| 관리 부담 | 코드 발급/만료 관리 | 도메인 설정만 |
| 사용자 경험 | 코드 받아야 가입 | 회사 이메일만으로 가입 |
| 익명성 | ✅ | ✅ (해시만 저장) |
| 외부인 차단 | △ (코드 유출 시 불가) | ✅ (도메인 제한) |

## 스키마 변경

### 추가

```prisma
model EmailVerification {
  id        String   @id @default(cuid())
  email     String
  otp       String
  expiresAt DateTime
  verified  Boolean  @default(false)
  attempts  Int      @default(0)
  createdAt DateTime @default(now())

  @@index([email, otp])
}

model AllowedDomain {
  id        String   @id @default(cuid())
  domain    String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 변경

```prisma
model User {
  // 기존 필드 유지
  emailHash String? @unique  // SHA-256 해시 (신규)
  // join_code 관련 필드 제거 또는 deprecated
}
```

## 구현 영향

| 영역 | 변경 |
|------|------|
| `src/lib/auth/` | OTP 생성/검증 로직 추가 |
| `src/app/(auth)/register/` | 가입 UI 변경 (이메일 → OTP → 설정) |
| `prisma/schema.prisma` | EmailVerification, AllowedDomain 모델 추가 |
| `src/app/(main)/admin/` | 도메인 관리 UI 추가 |
| 이메일 발송 | Nodemailer 또는 Resend 통합 필요 |

## 대안 (기각)

1. **SSO (Google Workspace)**: 과도한 복잡도, 소규모 회사에 부적합
2. **매직 링크**: OTP보다 UX 복잡 (이메일 → 클릭 → 리다이렉트)
3. **join_code 유지 + 만료 강화**: 근본적 보안 문제 해결 안 됨

## 리스크

- 이메일 발송 서비스 의존 (SMTP 또는 API)
- OTP 브루트포스 → 5회 시도 제한 + 10분 잠금
- 이메일 서비스 장애 시 가입 불가 → join_code fallback 고려
