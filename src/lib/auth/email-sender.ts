/**
 * 이메일 발송 모듈
 *
 * 현재: 개발 환경에서는 콘솔 로그로 OTP 출력
 * 프로덕션: Nodemailer 또는 Resend API로 전환 예정
 *
 * 이메일은 OTP 발송 용도로만 사용.
 * 뉴스레터, 알림 등 다른 용도로 사용하지 않음.
 */

export interface SendOtpResult {
  readonly success: boolean;
  readonly error?: string;
}

/**
 * OTP 이메일 발송
 *
 * @param email - 수신자 이메일 (검증 후 폐기)
 * @param otp - 6자리 OTP 코드
 */
export async function sendOtpEmail(
  email: string,
  otp: string,
): Promise<SendOtpResult> {
  // 개발 환경: 콘솔 출력
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n══════════════════════════════════`);
    console.log(`  SOKDAK OTP 인증 코드`);
    console.log(`  수신: ${email}`);
    console.log(`  코드: ${otp}`);
    console.log(`  유효: 5분`);
    console.log(`══════════════════════════════════\n`);
    return { success: true };
  }

  // 프로덕션: SMTP 또는 API 발송
  // TODO: Resend 또는 Nodemailer 통합
  // const transporter = nodemailer.createTransport({...});
  // await transporter.sendMail({
  //   from: 'SOKDAK <noreply@goodmit.co.kr>',
  //   to: email,
  //   subject: 'SOKDAK 가입 인증 코드',
  //   html: `<p>인증 코드: <strong>${otp}</strong></p><p>5분 내에 입력해 주세요.</p>`,
  // });

  return { success: false, error: "프로덕션 이메일 발송 미구현" };
}
