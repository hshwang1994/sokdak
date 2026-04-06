/**
 * 이메일 OTP 생성/검증 모듈 (ADR-001)
 *
 * 원칙:
 * - 이메일 원본은 검증 과정에서만 사용, DB에 장기 보관하지 않음
 * - User 테이블에는 SHA-256 해시만 저장 (중복 가입 방지)
 * - OTP: 6자리 숫자, 5분 유효, 5회 시도 제한 + 10분 잠금
 */

import { createHash, randomInt } from "crypto";

/** OTP 설정 상수 */
export const OTP_CONFIG = {
  /** OTP 자릿수 */
  digits: 6,
  /** 유효 시간 (밀리초) */
  ttlMs: 5 * 60 * 1000, // 5분
  /** 최대 시도 횟수 */
  maxAttempts: 5,
  /** 잠금 시간 (밀리초) */
  lockoutMs: 10 * 60 * 1000, // 10분
} as const;

/**
 * 6자리 OTP 생성
 * crypto.randomInt 사용 (보안 랜덤)
 */
export function generateOtp(): string {
  const min = 10 ** (OTP_CONFIG.digits - 1);
  const max = 10 ** OTP_CONFIG.digits;
  return String(randomInt(min, max));
}

/**
 * OTP를 SHA-256 해시로 변환 (DB 저장용)
 */
export function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

/**
 * 이메일을 SHA-256 해시로 변환 (User.emailHash 저장용)
 * 소문자로 정규화 후 해싱
 */
export function hashEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * OTP 만료 시간 계산
 */
export function otpExpiresAt(): Date {
  return new Date(Date.now() + OTP_CONFIG.ttlMs);
}

/**
 * 잠금 해제 시간 계산
 */
export function lockoutUntil(): Date {
  return new Date(Date.now() + OTP_CONFIG.lockoutMs);
}

/**
 * 이메일 도메인 추출
 */
export function extractDomain(email: string): string {
  const parts = email.trim().toLowerCase().split("@");
  return parts[1] ?? "";
}

/**
 * 이메일 형식 기본 검증
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}
