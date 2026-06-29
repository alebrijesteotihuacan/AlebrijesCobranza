import { NextResponse } from "next/server";
import { getBadgeCounts } from "@/lib/queries/badges";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const counts = await getBadgeCounts();
    return NextResponse.json(counts);
  } catch (e) {
    console.error("api/badges", e);
    return NextResponse.json(
      { comprobantes: 0, desconocidos: 0, error: String(e) },
      { status: 500 },
    );
  }
}
