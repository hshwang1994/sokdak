/**
 * POST /api/auth/login — 로그인
 * DELETE /api/auth/login — 로그아웃
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { createSession, destroySession } from "@/lib/auth/session";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: parsed.error.errors[0]?.message ?? "입력이 올바르지 않습니다" },
        { status: 400 },
      );
    }

    const { loginId, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { loginId } });
    if (!user || !user.isActive) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "아이디 또는 비밀번호가 올바르지 않습니다" },
        { status: 401 },
      );
    }

    const argon2 = await import("argon2");
    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "아이디 또는 비밀번호가 올바르지 않습니다" },
        { status: 401 },
      );
    }

    const userAgent = request.headers.get("user-agent") ?? undefined;
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      undefined;
    await createSession(user.id, userAgent, ipAddress);

    return NextResponse.json<ApiResponse<{ loginId: string; displayNickname: string }>>(
      {
        success: true,
        data: { loginId: user.loginId, displayNickname: user.displayNickname },
        error: null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    await destroySession();
    return NextResponse.json<ApiResponse<null>>(
      { success: true, data: null, error: null },
      { status: 200 },
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
