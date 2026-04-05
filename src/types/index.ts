// SOKDAK 공통 타입 정의

export type ApiResponse<T> = {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: string | null;
  readonly meta?: {
    readonly total?: number;
    readonly page?: number;
    readonly limit?: number;
  };
};

export type SessionUser = {
  readonly id: string;
  readonly loginId: string;
  readonly displayNickname: string;
  readonly role: Role;
};

export type Role =
  | "user"
  | "moderator"
  | "admin"
  | "super_admin"
  | "audit_admin";

export type EmojiReaction = "like" | "empathy" | "funny" | "sad" | "angry";

export type Emotion = "happy" | "neutral" | "tired" | "sad" | "angry";

export type ReportReason = "spam" | "abuse" | "privacy" | "other";

export type SanctionType =
  | "warning"
  | "post_delete"
  | "temp_ban"
  | "perm_ban";

export type NotificationType = "comment" | "reaction" | "sanction" | "system";
