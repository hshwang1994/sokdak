import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding SOKDAK database...");

  // 1. 기본 게시판 생성
  const boards = [
    { name: "자유게시판", slug: "free", description: "자유로운 이야기를 나눠요", sortOrder: 1 },
    { name: "질문게시판", slug: "questions", description: "궁금한 것을 물어봐요", sortOrder: 2 },
    { name: "제안게시판", slug: "suggestions", description: "회사에 바라는 점을 제안해요", sortOrder: 3 },
  ];

  for (const board of boards) {
    await prisma.board.upsert({
      where: { slug: board.slug },
      update: {},
      create: board,
    });
  }

  console.log(`Created ${boards.length} boards`);

  // 2. 기본 설정 생성
  const settings = [
    { key: "site.name", value: JSON.stringify("SOKDAK") },
    { key: "site.description", value: JSON.stringify("사내 익명 커뮤니티") },
    { key: "lunch_vote.open_time", value: JSON.stringify("11:00") },
    { key: "lunch_vote.close_time", value: JSON.stringify("11:30") },
    { key: "session.max_concurrent", value: JSON.stringify(3) },
    { key: "post.max_length", value: JSON.stringify(10000) },
    { key: "comment.max_depth", value: JSON.stringify(2) },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log(`Created ${settings.length} settings`);

  // 3. super_admin 계정은 실행 시 환경 변수로 생성
  // argon2는 별도 설치 필요하므로 seed에서는 생략
  console.log("NOTE: Run 'npm run admin:create' to create the super_admin account");

  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
