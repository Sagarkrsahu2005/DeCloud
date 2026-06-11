import { NextResponse } from "next/server"
import { getSessionWalletAddress } from "@/lib/wallet-auth"
import { getMongoDb } from "@/lib/mongodb"

export const runtime = "nodejs"

type FilePayload = {
  id: number
  owner: string
  name: string
  size: number
  type: string
  data?: string
  encryptedData?: string
  iv?: string
  uploadDate: string
  blockchainHash: string
  encrypted: boolean
  verified: boolean
  shareLink: string
}

function toFilePayload(value: unknown): FilePayload | null {
  if (!value || typeof value !== "object") return null
  const record = value as Partial<FilePayload>
  if (
    typeof record.id !== "number" ||
    typeof record.owner !== "string" ||
    typeof record.name !== "string" ||
    typeof record.size !== "number" ||
    typeof record.type !== "string" ||
    typeof record.uploadDate !== "string" ||
    typeof record.blockchainHash !== "string" ||
    typeof record.encrypted !== "boolean" ||
    typeof record.verified !== "boolean" ||
    typeof record.shareLink !== "string"
  ) {
    return null
  }

  return {
    id: record.id,
    owner: record.owner,
    name: record.name,
    size: record.size,
    type: record.type,
    data: typeof record.data === "string" ? record.data : undefined,
    encryptedData: typeof record.encryptedData === "string" ? record.encryptedData : undefined,
    iv: typeof record.iv === "string" ? record.iv : undefined,
    uploadDate: record.uploadDate,
    blockchainHash: record.blockchainHash,
    encrypted: record.encrypted,
    verified: record.verified,
    shareLink: record.shareLink,
  }
}

export async function GET(request: Request) {
  const owner = await getSessionWalletAddress()
  if (!owner) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
  }

  const db = await getMongoDb()
  const files = await db.collection<FilePayload>("files").find({ owner }).sort({ uploadDate: -1, id: -1 }).toArray()

  return NextResponse.json({ ok: true, files })
}

export async function POST(request: Request) {
  const owner = await getSessionWalletAddress()
  if (!owner) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
  }

  const payload = toFilePayload(await request.json())

  if (!payload) {
    return NextResponse.json({ ok: false, error: "INVALID_FILE_PAYLOAD" }, { status: 400 })
  }

  if (payload.owner !== owner) {
    return NextResponse.json({ ok: false, error: "OWNER_MISMATCH" }, { status: 403 })
  }

  const db = await getMongoDb()
  await db.collection<FilePayload>("files").updateOne(
    { owner, id: payload.id },
    { $set: { ...payload, owner } },
    { upsert: true },
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const owner = await getSessionWalletAddress()
  if (!owner) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })
  }

  const url = new URL(request.url)
  const idParam = url.searchParams.get("id")

  if (!idParam) {
    return NextResponse.json({ ok: false, error: "ID_REQUIRED" }, { status: 400 })
  }

  const id = Number(idParam)
  if (Number.isNaN(id)) {
    return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 })
  }

  const db = await getMongoDb()
  await db.collection<FilePayload>("files").deleteOne({ owner, id })

  return NextResponse.json({ ok: true })
}
