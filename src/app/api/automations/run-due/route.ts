import { NextResponse } from "next/server";
import { requireCompanyUser } from "@/lib/auth";
import { runDueAutomations } from "@/lib/automation-runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const session = await requireCompanyUser();
  const result = await runDueAutomations({
    companyId: session.companyId,
    limit: 10,
  });

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
