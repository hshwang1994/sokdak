/**
 * 세션 관리 모듈
 *
 * httpOnly 쿠키 기반, 최대 동시 3세션
 */

import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

const SESSION_COOKIE_NAME = "sokdak-session";
const SESSION_MAX_AGE_HOURS = Number(
  process.env.SESSION_MAX_AGE_HOURS ?? "168",
);
const MAX_CONCURRENT_SESSIONS = 3;

/**
 * 세션 토큰 생성 (32바이트 랜덤)
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * 세션 생성 + 쿠키 설정
 * 동시 세션 3개 초과 시 가장 오래된 세션 삭제
 */
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string,
): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(
    Date.now() + SESSION_MAX_AGE_HOURS * 60 * 60 * 1000,
  );

  // 동시 세션 제한: 오래된 세션부터 삭제
  const existingSessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (existingSessions.length >= MAX_CONCURRENT_SESSIONS) {
    const toDelete = existingSessions.slice(
      0,
      existingSessions.length - MAX_CONCURRENT_SESSIONS + 1,
    );
    await prisma.session.deleteMany({
      where: { id: { in: toDelete.map((s) => s.id) } },
    });
  }

  await prisma.session.create({
    data: { token, userId, expiresAt, userAgent, ipAddress },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_HOURS * 60 * 60,
  });

  return token;
}

/**
 * 현재 세션 사용자 가져오기 (null이면 미로그인)
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  return {
    id: session.user.id,
    loginId: session.user.loginId,
    displayNickname: session.user.displayNickname,
    role: session.user.role as SessionUser["role"],
  };
}

/**
 * 세션 삭제 (로그아웃)
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}
