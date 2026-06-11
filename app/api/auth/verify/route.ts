import { getAddress, isAddress, verifyMessage } from "ethers"
import { NextResponse } from "next/server"

import {
  AUTH_SESSION_TTL_MS,
  attachSessionCookie,
  buildAuthMessage,
  createSessionToken,
  hashToken,
} from "@/lib/wallet-auth"
import { getMongoDb } from "@/lib/mongodb"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = (await request.json()) as { address?: string; signature?: string }
  const address = body.address?.trim()
  const signature = body.signature?.trim()

  if (!address || !signature || !isAddress(address)) {
    return NextResponse.json({ ok: false, error: "INVALID_AUTH_PAYLOAD" }, { status: 400 })
  }

  const db = await getMongoDb()
  const nonceDoc = await db.collection<{
    address: string
    nonce: string
    issuedAt: string
    expiresAt: Date
  }>("wallet_nonces").findOne({ address })

  if (!nonceDoc || nonceDoc.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: "NONCE_EXPIRED" }, { status: 401 })
  }

  const expectedMessage = buildAuthMessage(address, nonceDoc.nonce, nonceDoc.issuedAt)
  const recovered = getAddress(verifyMessage(expectedMessage, signature))
  if (getAddress(address) !== recovered) {
    return NextResponse.json({ ok: false, error: "SIGNATURE_INVALID" }, { status: 401 })
  }

  await db.collection("wallet_nonces").deleteOne({ address })

  const token = createSessionToken()
  const expiresAt = new Date(Date.now() + AUTH_SESSION_TTL_MS)
  await db.collection("wallet_sessions").updateOne(
    { tokenHash: hashToken(token) },
    {
      $set: {
        tokenHash: hashToken(token),
        address: getAddress(address),
        createdAt: new Date(),
        expiresAt,
      },
    },
    { upsert: true },
  )

  const response = NextResponse.json({ ok: true, address: getAddress(address), expiresAt: expiresAt.toISOString() })
  attachSessionCookie(response, token)
  return response
}
