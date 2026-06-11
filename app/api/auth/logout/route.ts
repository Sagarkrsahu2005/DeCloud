import { NextResponse } from "next/server"

import { clearSessionCookie, hashToken, AUTH_COOKIE_NAME } from "@/lib/wallet-auth"
import { getMongoDb } from "@/lib/mongodb"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") || ""
  const match = cookieHeader.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`))
  if (match?.[1]) {
    const db = await getMongoDb()
    await db.collection("wallet_sessions").deleteOne({ tokenHash: hashToken(match[1]) })
  }

  const response = NextResponse.json({ ok: true, cleared: true })
  clearSessionCookie(response)
  return response
}
