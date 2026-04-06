/**
 * GET    /api/boards/:id — 게시판 상세 + 게시글 목록
 * PATCH  /api/boards/:id — 게시판 수정 (admin 이상)
 * DELETE /api/boards/:id — 게시판 비활성화 (admin 이상)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { updateBoardSchema } from "@/lib/validations/board";
import type { ApiResponse } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Params) {
  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    const board = await prisma.board.findUnique({
      where: { id },
    });

    if (!board || !board.isActive) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "게시판을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { boardId: id, isHidden: false },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          viewCount: true,
          createdAt: true,
          author: { select: { displayNickname: true } },
          _count: { select: { comments: true, reactions: true } },
        },
      }),
      prisma.post.count({ where: { boardId: id, isHidden: false } }),
    ]);

    return NextResponse.json<ApiResponse<{ board: typeof board; posts: typeof posts }>>({
      success: true,
      data: { board, posts },
      error: null,
      meta: { total, page, limit },
    });
  } catch (error) {
    console.error("Board detail error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: Params) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "관리자 권한이 필요합니다" },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateBoardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: parsed.error.errors[0]?.message ?? "입력이 올바르지 않습니다" },
        { status: 400 },
      );
    }

    const board = await prisma.board.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json<ApiResponse<typeof board>>({
      success: true,
      data: board,
      error: null,
    });
  } catch (error) {
    console.error("Board update error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: Params) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: "관리자 권한이 필요합니다" },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    // 소프트 삭제 (isActive = false)
    const board = await prisma.board.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { success: true, data: { id: board.id }, error: null },
    );
  } catch (error) {
    console.error("Board delete error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
