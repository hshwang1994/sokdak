/**
 * 인증 관련 Zod 스키마 (입력 검증)
 */

import { z } from "zod";

/** 이메일 OTP 요청 */
export const requestOtpSchema = z.object({
  email: z
    .string()
    .email("올바른 이메일 형식이 아닙니다")
    .max(255)
    .transform((v) => v.trim().toLowerCase()),
});

/** OTP 확인 */
export const verifyOtpSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.trim().toLowerCase()),
  otp: z
    .string()
    .length(6, "인증 코드는 6자리입니다")
    .regex(/^\d+$/, "숫자만 입력해 주세요"),
});

/** 회원가입 완료 (OTP 확인 후) */
export const registerSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.trim().toLowerCase()),
  loginId: z
    .string()
    .min(4, "아이디는 4자 이상이어야 합니다")
    .max(20, "아이디는 20자 이하여야 합니다")
    .regex(/^[a-zA-Z0-9_]+$/, "영문, 숫자, 밑줄만 사용 가능합니다"),
  displayNickname: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 합니다")
    .max(12, "닉네임은 12자 이하여야 합니다"),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다")
    .max(128),
});

/** 로그인 */
export const loginSchema = z.object({
  loginId: z.string().min(1, "아이디를 입력해 주세요"),
  password: z.string().min(1, "비밀번호를 입력해 주세요"),
});
