/**
 * OTP 모듈 단위 테스트
 */

import { describe, it, expect } from "vitest";
import {
  generateOtp,
  hashOtp,
  hashEmail,
  otpExpiresAt,
  lockoutUntil,
  extractDomain,
  isValidEmailFormat,
  OTP_CONFIG,
} from "@/lib/auth/otp";

describe("OTP 생성", () => {
  it("6자리 숫자를 생성한다", () => {
    const otp = generateOtp();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it("매번 다른 값을 생성한다 (확률적)", () => {
    const otps = new Set(Array.from({ length: 100 }, () => generateOtp()));
    expect(otps.size).toBeGreaterThan(90); // 100개 중 90개 이상 유니크
  });

  it("100000 ~ 999999 범위 내에 있다", () => {
    for (let i = 0; i < 100; i++) {
      const num = Number(generateOtp());
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThan(1000000);
    }
  });
});

describe("OTP 해싱", () => {
  it("동일 OTP는 동일 해시를 반환한다", () => {
    const otp = "123456";
    expect(hashOtp(otp)).toBe(hashOtp(otp));
  });

  it("다른 OTP는 다른 해시를 반환한다", () => {
    expect(hashOtp("123456")).not.toBe(hashOtp("654321"));
  });

  it("SHA-256 해시 길이(64자 hex)를 반환한다", () => {
    expect(hashOtp("123456")).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hashOtp("123456"))).toBe(true);
  });
});

describe("이메일 해싱", () => {
  it("소문자로 정규화 후 해싱한다", () => {
    expect(hashEmail("User@Example.COM")).toBe(hashEmail("user@example.com"));
  });

  it("앞뒤 공백을 제거한다", () => {
    expect(hashEmail("  user@test.com  ")).toBe(hashEmail("user@test.com"));
  });

  it("SHA-256 해시를 반환한다", () => {
    expect(hashEmail("test@test.com")).toHaveLength(64);
  });
});

describe("도메인 추출", () => {
  it("이메일에서 도메인을 추출한다", () => {
    expect(extractDomain("user@goodmit.co.kr")).toBe("goodmit.co.kr");
  });

  it("대소문자를 소문자로 변환한다", () => {
    expect(extractDomain("User@GOODMIT.CO.KR")).toBe("goodmit.co.kr");
  });

  it("@가 없으면 빈 문자열을 반환한다", () => {
    expect(extractDomain("invalid-email")).toBe("");
  });
});

describe("이메일 형식 검증", () => {
  it("올바른 이메일을 통과시킨다", () => {
    expect(isValidEmailFormat("user@goodmit.co.kr")).toBe(true);
    expect(isValidEmailFormat("test.user@example.com")).toBe(true);
  });

  it("잘못된 이메일을 거부한다", () => {
    expect(isValidEmailFormat("")).toBe(false);
    expect(isValidEmailFormat("no-at-sign")).toBe(false);
    expect(isValidEmailFormat("@no-local.com")).toBe(false);
    expect(isValidEmailFormat("no-domain@")).toBe(false);
    expect(isValidEmailFormat("spaces in@email.com")).toBe(false);
  });
});

describe("시간 계산", () => {
  it("OTP 만료 시간은 현재 + 5분이다", () => {
    const before = Date.now();
    const expires = otpExpiresAt();
    const after = Date.now();

    expect(expires.getTime()).toBeGreaterThanOrEqual(before + OTP_CONFIG.ttlMs);
    expect(expires.getTime()).toBeLessThanOrEqual(after + OTP_CONFIG.ttlMs);
  });

  it("잠금 시간은 현재 + 10분이다", () => {
    const before = Date.now();
    const locked = lockoutUntil();
    const after = Date.now();

    expect(locked.getTime()).toBeGreaterThanOrEqual(before + OTP_CONFIG.lockoutMs);
    expect(locked.getTime()).toBeLessThanOrEqual(after + OTP_CONFIG.lockoutMs);
  });
});

describe("OTP 설정 상수", () => {
  it("6자리 숫자", () => {
    expect(OTP_CONFIG.digits).toBe(6);
  });

  it("5분 유효", () => {
    expect(OTP_CONFIG.ttlMs).toBe(5 * 60 * 1000);
  });

  it("최대 5회 시도", () => {
    expect(OTP_CONFIG.maxAttempts).toBe(5);
  });

  it("10분 잠금", () => {
    expect(OTP_CONFIG.lockoutMs).toBe(10 * 60 * 1000);
  });
});
