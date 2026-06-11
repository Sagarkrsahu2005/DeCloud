import "server-only"

import { createHash, randomBytes } from "crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { getMongoDb } from "@/lib/mongodb"

export const AUTH_COOKIE_NAME = "decloud_wallet_session"
export const AUTH_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function buildAuthMessage(address: string, nonce: string, issuedAt: string) {
  return `DeCloud authentication\nAddress: ${address}\nNonce: ${nonce}\nIssued At: ${issuedAt}`
}

export async function getSessionWalletAddress(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!token) return null

  const db = await getMongoDb()
  const session = await db.collection<{ address: string }>("wallet_sessions").findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  })

  return session?.address || null
}

export function attachSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_SESSION_TTL_MS / 1000,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}

export function createSessionToken() {
  return randomBytes(32).toString("hex")
}
