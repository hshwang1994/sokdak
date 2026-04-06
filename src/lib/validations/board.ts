/**
 * 게시판 관련 Zod 스키마
 */

import { z } from "zod";

/** 게시판 생성 */
export const createBoardSchema = z.object({
  name: z
    .string()
    .min(1, "게시판 이름을 입력해 주세요")
    .max(50, "게시판 이름은 50자 이하여야 합니다"),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "slug는 소문자, 숫자, 하이픈만 사용 가능합니다",
    ),
  description: z.string().max(200).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

/** 게시판 수정 */
export const updateBoardSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
