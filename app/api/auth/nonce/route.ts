import { randomBytes } from "crypto"

import { isAddress } from "ethers"
import { NextResponse } from "next/server"

import { buildAuthMessage } from "@/lib/wallet-auth"
import { getMongoDb } from "@/lib/mongodb"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = (await request.json()) as { address?: string }
  const address = body.address?.trim()

  if (!address || !isAddress(address)) {
    return NextResponse.json({ ok: false, error: "INVALID_ADDRESS" }, { status: 400 })
  }

  const nonce = randomBytes(16).toString("hex")
  const issuedAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
  const message = buildAuthMessage(address, nonce, issuedAt)

  const db = await getMongoDb()
  await db.collection("wallet_nonces").updateOne(
    { address },
    {
      $set: {
        address,
        nonce,
        message,
        issuedAt,
        expiresAt,
      },
    },
    { upsert: true },
  )

  return NextResponse.json({ ok: true, address, nonce, message, issuedAt, expiresAt: expiresAt.toISOString() })
}
