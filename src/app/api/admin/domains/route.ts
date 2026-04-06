/**
 * GET  /api/admin/domains — 허용 도메인 목록
 * POST /api/admin/domains — 도메인 추가 (super_admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";
import type { ApiResponse } from "@/types";

const addDomainSchema = z.object({
  domain: z
    .string()
    .min(3)
    .max(255)
    .regex(
      /^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/,
      "올바른 도메인 형식이 아닙니다",
    )
    .transform((v) => v.trim().toLowerCase()),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "관리자 권한이 필요합니다" },
        { status: 403 },
      );
    }

    const domains = await prisma.allowedDomain.findMany({
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json<ApiResponse<typeof domains>>({
      success: true,
      data: domains,
      error: null,
    });
  } catch (error) {
    console.error("Domain list error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "super_admin") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "최고 관리자 권한이 필요합니다" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = addDomainSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: parsed.error.errors[0]?.message ?? "입력이 올바르지 않습니다" },
        { status: 400 },
      );
    }

    const existing = await prisma.allowedDomain.findUnique({
      where: { domain: parsed.data.domain },
    });
    if (existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "이미 등록된 도메인입니다" },
        { status: 409 },
      );
    }

    const domain = await prisma.allowedDomain.create({
      data: { domain: parsed.data.domain },
    });

    return NextResponse.json<ApiResponse<typeof domain>>(
      { success: true, data: domain, error: null },
      { status: 201 },
    );
  } catch (error) {
    console.error("Domain add error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
