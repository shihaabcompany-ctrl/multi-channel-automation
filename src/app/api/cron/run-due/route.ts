import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { runDueAutomations } from "@/lib/automation-runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const result = await runDueAutomations({ limit: 10 });

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
