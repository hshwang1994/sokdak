# SOKDAK UI 시스템

## 색상 토큰

### 브랜드 색상

```css
--sokdak-primary: #6C63FF;      /* 메인 보라 */
--sokdak-primary-light: #8B83FF;
--sokdak-primary-dark: #4F46E5;
--sokdak-secondary: #FF6B9D;    /* 포인트 핑크 */
--sokdak-accent: #FFD93D;       /* 강조 노랑 */
```

### 의미 색상

```css
--sokdak-success: #4ADE80;
--sokdak-warning: #FBBF24;
--sokdak-error: #F87171;
--sokdak-info: #60A5FA;
```

### 감정 색상 (감정 공유 기능)

```css
--emotion-happy: #FFD93D;     /* 😊 */
--emotion-sad: #60A5FA;       /* 😢 */
--emotion-angry: #F87171;     /* 😡 */
--emotion-tired: #A78BFA;     /* 😩 */
--emotion-excited: #FB923C;   /* 🎉 */
--emotion-calm: #34D399;      /* 😌 */
```

### 배경/표면

```css
--bg-primary: #FAFAFA;          /* 라이트 모드 */
--bg-surface: #FFFFFF;
--bg-elevated: #F5F3FF;         /* 보라 틴트 */
--bg-primary-dark: #0F0E17;     /* 다크 모드 */
--bg-surface-dark: #1A1929;
```

## 타이포그래피

| 용도 | 크기 | 무게 | 행간 |
|------|------|------|------|
| H1 (페이지 제목) | 24px | Bold (700) | 1.3 |
| H2 (섹션 제목) | 20px | SemiBold (600) | 1.4 |
| H3 (카드 제목) | 16px | SemiBold (600) | 1.4 |
| Body | 14px | Regular (400) | 1.6 |
| Caption | 12px | Regular (400) | 1.5 |
| Button | 14px | Medium (500) | 1.0 |

- 한글: Pretendard
- 영문/숫자: Inter
- 코드: JetBrains Mono

## 간격 (Spacing)

```
4px  (xs)  — 아이콘과 텍스트 사이
8px  (sm)  — 같은 그룹 내 요소 간
12px (md)  — 카드 내부 패딩
16px (lg)  — 섹션 간, 카드 패딩
24px (xl)  — 페이지 여백
32px (2xl) — 대섹션 간
```

## 모서리 (Border Radius)

```
4px  — 작은 뱃지, 태그
8px  — 버튼, 입력 필드
12px — 카드
16px — 모달, 바텀시트
Full — 아바타, 칩
```

## 그림자 (Shadow)

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.07);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-card: 0 2px 8px rgba(108,99,255,0.08);  /* 보라 틴트 */
```

## 컴포넌트 규격

### 카드

- 배경: white (light) / surface-dark (dark)
- 패딩: 16px
- 모서리: 12px
- 그림자: shadow-card
- hover: scale(1.01) + shadow-md

### 버튼

- 높이: 40px (default), 36px (sm), 48px (lg)
- 패딩 좌우: 16px (default), 12px (sm), 24px (lg)
- 모서리: 8px
- 전환: 150ms ease

### 아바타 (익명)

- 크기: 32px (sm), 40px (md), 56px (lg)
- 모서리: full (원형)
- 배경: 닉네임 해시 기반 그라데이션
- 아이콘: 동물/캐릭터 일러스트 (20종 세트)

### 리액션 버튼

- 크기: 32px
- hover: scale(1.2) + 0.1s bounce
- 선택 시: 배경 + 카운트 표시
- 이모지 세트: 좋아요👍, 공감❤️, 웃겨요😂, 슬퍼요😢, 화나요😡

## 애니메이션

| 동작 | 효과 | 시간 |
|------|------|------|
| 페이지 전환 | fade + slide-up | 200ms |
| 카드 등장 | fade-in + scale(0.95→1) | 300ms, stagger 50ms |
| 투표 결과 | 프로그레스 바 확장 | 500ms ease-out |
| 리액션 | bounce | 300ms |
| 삭제 | slide-out + fade | 200ms |
| 토스트 | slide-in from top | 250ms |

## 다크 모드

- 시스템 설정 따름 (기본)
- 수동 토글 가능 (설정)
- CSS 변수 기반 전환
- 이미지/아이콘은 다크 모드용 별도 세트 불필요 (색상 토큰으로 처리)
