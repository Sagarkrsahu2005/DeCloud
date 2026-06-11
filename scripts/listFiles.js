const fs = require('fs')
const { MongoClient } = require('mongodb')

function readEnv() {
  const p = './.env.local'
  if (!fs.existsSync(p)) throw new Error('.env.local not found')
  const txt = fs.readFileSync(p, 'utf8')
  const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const env = {}
  for (const l of lines) {
    const idx = l.indexOf('=')
    if (idx === -1) continue
    const k = l.slice(0, idx)
    const v = l.slice(idx + 1)
    env[k] = v
  }
  return env
}

async function main() {
  const env = readEnv()
  const uri = env.MONGODB_URI
  const dbName = env.MONGODB_DB || 'decloud'
  if (!uri) {
    console.error('MONGODB_URI not found in .env.local')
    process.exit(2)
  }

  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db(dbName)
    console.log('Connected to', dbName)

    const cols = await db.listCollections().toArray()
    console.log('Collections:', cols.map(c => c.name).join(', '))

    const files = await db.collection('files').find({}).sort({ uploadDate: -1, id: -1 }).toArray()
    console.log('files count:', files.length)
    console.log(JSON.stringify(files, null, 2))
  } catch (err) {
    console.error(err)
    process.exit(1)
  } finally {
    await client.close()
  }
}

main()
