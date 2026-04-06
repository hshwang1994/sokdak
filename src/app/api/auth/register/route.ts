/**
 * POST /api/auth/register
 *
 * 2단계 가입 플로우:
 * Step 1 (body.step === "request-otp"): 이메일 → OTP 발송
 * Step 2 (body.step === "complete"):     이메일 + OTP + 프로필 → 계정 생성
 *
 * 이메일 처리 원칙:
 * - DB에는 SHA-256 해시만 저장 (User.emailHash)
 * - EmailVerification 레코드는 가입 완료 후 삭제
 * - 이메일 원본은 어디에도 장기 보관하지 않음
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
import { sendOtpEmail } from "@/lib/auth/email-sender";
import { requestOtpSchema, registerSchema } from "@/lib/validations/auth";
import { createSession } from "@/lib/auth/session";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const step = body.step as string;

    if (step === "request-otp") {
      return handleRequestOtp(body);
    }
    if (step === "complete") {
      return handleComplete(body, request);
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "올바른 step 값이 필요합니다 (request-otp | complete)" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/**
 * Step 1: 이메일 검증 + OTP 발송
 */
async function handleRequestOtp(body: unknown) {
  const parsed = requestOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: parsed.error.errors[0]?.message ?? "입력이 올바르지 않습니다" },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  // 이메일 형식 검증
  if (!isValidEmailFormat(email)) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "올바른 이메일 형식이 아닙니다" },
      { status: 400 },
    );
  }

  // 허용 도메인 확인
  const domain = extractDomain(email);
  const allowedDomain = await prisma.allowedDomain.findFirst({
    where: { domain, isActive: true },
  });
  if (!allowedDomain) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: `${domain} 도메인은 가입이 허용되지 않습니다. 회사 이메일을 사용해 주세요.` },
      { status: 403 },
    );
  }

  // 중복 가입 확인 (해시 기반)
  const emailHashValue = hashEmail(email);
  const existingUser = await prisma.user.findUnique({
    where: { emailHash: emailHashValue },
  });
  if (existingUser) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "이미 가입된 이메일입니다" },
      { status: 409 },
    );
  }

  // 기존 미확인 OTP 잠금 확인
  const existing = await prisma.emailVerification.findFirst({
    where: { email, verified: false },
    orderBy: { createdAt: "desc" },
  });
  if (existing?.lockedUntil && existing.lockedUntil > new Date()) {
    const remainMin = Math.ceil(
      (existing.lockedUntil.getTime() - Date.now()) / 60000,
    );
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: `잠시 후 다시 시도해 주세요 (${remainMin}분 후)` },
      { status: 429 },
    );
  }

  // OTP 생성 + 저장
  const otp = generateOtp();
  await prisma.emailVerification.create({
    data: {
      email,
      otpHash: hashOtp(otp),
      expiresAt: otpExpiresAt(),
    },
  });

  // 이메일 발송
  const sendResult = await sendOtpEmail(email, otp);
  if (!sendResult.success && process.env.NODE_ENV === "production") {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "인증 코드 발송에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  return NextResponse.json<ApiResponse<{ sent: boolean }>>(
    { success: true, data: { sent: true }, error: null },
    { status: 200 },
  );
}

/**
 * Step 2: OTP 확인 + 계정 생성
 */
async function handleComplete(body: unknown, request: NextRequest) {
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: parsed.error.errors[0]?.message ?? "입력이 올바르지 않습니다" },
      { status: 400 },
    );
  }

  const { email, loginId, displayNickname, password } = parsed.data;
  const otpInput = (body as Record<string, unknown>).otp as string;

  if (!otpInput || otpInput.length !== 6) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "인증 코드를 입력해 주세요" },
      { status: 400 },
    );
  }

  // OTP 검증
  const verification = await prisma.emailVerification.findFirst({
    where: { email, verified: false },
    orderBy: { createdAt: "desc" },
  });

  if (!verification) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "인증 요청을 먼저 진행해 주세요" },
      { status: 400 },
    );
  }

  // 잠금 확인
  if (verification.lockedUntil && verification.lockedUntil > new Date()) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 },
    );
  }

  // 만료 확인
  if (verification.expiresAt < new Date()) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "인증 코드가 만료되었습니다. 다시 요청해 주세요." },
      { status: 410 },
    );
  }

  // OTP 해시 비교
  if (hashOtp(otpInput) !== verification.otpHash) {
    const newAttempts = verification.attempts + 1;
    const updateData: Record<string, unknown> = { attempts: newAttempts };

    if (newAttempts >= OTP_CONFIG.maxAttempts) {
      updateData.lockedUntil = lockoutUntil();
    }

    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: updateData,
    });

    const remaining = OTP_CONFIG.maxAttempts - newAttempts;
    const msg =
      remaining > 0
        ? `인증 코드가 올바르지 않습니다 (${remaining}회 남음)`
        : "너무 많은 시도가 있었습니다. 10분 후 다시 시도해 주세요.";

    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: msg },
      { status: 401 },
    );
  }

  // loginId 중복 확인
  const existingLogin = await prisma.user.findUnique({
    where: { loginId },
  });
  if (existingLogin) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "이미 사용 중인 아이디입니다" },
      { status: 409 },
    );
  }

  // 비밀번호 해싱 (Argon2id)
  const argon2 = await import("argon2");
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: Number(process.env.ARGON2_MEMORY_COST ?? "65536"),
    timeCost: Number(process.env.ARGON2_TIME_COST ?? "3"),
    parallelism: Number(process.env.ARGON2_PARALLELISM ?? "4"),
  });

  // 사용자 생성 (이메일 해시만 저장)
  const emailHashValue = hashEmail(email);
  const user = await prisma.user.create({
    data: {
      loginId,
      displayNickname,
      passwordHash,
      emailHash: emailHashValue,
    },
  });

  // 인증 레코드 정리 (이메일 원본 삭제)
  await prisma.emailVerification.deleteMany({ where: { email } });

  // 세션 생성
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  await createSession(user.id, userAgent, ipAddress);

  return NextResponse.json<ApiResponse<{ userId: string; loginId: string }>>(
    {
      success: true,
      data: { userId: user.id, loginId: user.loginId },
      error: null,
    },
    { status: 201 },
  );
}
