import { NextResponse } from "next/server"

import { getSessionWalletAddress } from "@/lib/wallet-auth"

export const runtime = "nodejs"

export async function GET() {
  const address = await getSessionWalletAddress()
  if (!address) {
    return NextResponse.json({ ok: false, address: null }, { status: 401 })
  }

  return NextResponse.json({ ok: true, address })
}
