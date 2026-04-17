import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: process.env.NEXT_PUBLIC_APP_NAME ?? "History Persona Chat",
    timestamp: new Date().toISOString()
  });
}
