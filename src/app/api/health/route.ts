import { NextResponse } from "next/server";

export async function GET() {
  const healthcheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      db: "pending",
      redis: "pending",
    },
  };

  // TODO: Add actual DB and Redis health checks

  return NextResponse.json(healthcheck);
}
