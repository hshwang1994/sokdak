export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold tracking-tight">SOKDAK</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        사내 익명 커뮤니티 서비스
      </p>
      <div className="mt-8 flex gap-4">
        <a
          href="/login"
          className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
        >
          로그인
        </a>
        <a
          href="/register"
          className="rounded-lg border border-input px-6 py-3 hover:bg-accent"
        >
          회원가입
        </a>
      </div>
    </main>
  );
}
