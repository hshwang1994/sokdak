/**
 * GET  /api/boards — 게시판 목록 조회
 * POST /api/boards — 게시판 생성 (admin 이상)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { createBoardSchema } from "@/lib/validations/board";
import type { ApiResponse } from "@/types";

export async function GET() {
  try {
    const boards = await prisma.board.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sortOrder: true,
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json<ApiResponse<typeof boards>>({
      success: true,
      data: boards,
      error: null,
    });
  } catch (error) {
    console.error("Board list error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "로그인이 필요합니다" },
        { status: 401 },
      );
    }
    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "관리자 권한이 필요합니다" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createBoardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: parsed.error.errors[0]?.message ?? "입력이 올바르지 않습니다" },
        { status: 400 },
      );
    }

    const { name, slug, description, sortOrder } = parsed.data;

    // slug 중복 확인
    const existing = await prisma.board.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "이미 사용 중인 slug입니다" },
        { status: 409 },
      );
    }

    const board = await prisma.board.create({
      data: { name, slug, description, sortOrder },
    });

    return NextResponse.json<ApiResponse<typeof board>>(
      { success: true, data: board, error: null },
      { status: 201 },
    );
  } catch (error) {
    console.error("Board create error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
