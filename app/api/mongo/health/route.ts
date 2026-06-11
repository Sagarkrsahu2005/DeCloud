import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"

export const runtime = "nodejs"

export async function GET() {
  try {
    const db = await getMongoDb()
    const ping = await db.command({ ping: 1 })

    return NextResponse.json({
      ok: true,
      database: db.databaseName,
      ping: ping.ok,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "MongoDB connection failed"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
