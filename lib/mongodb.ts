import "server-only"

import { MongoClient, type Db } from "mongodb"

const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable")
}

const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function getMongoClient() {
  return clientPromise
}

export async function getMongoDb(): Promise<Db> {
  const databaseName = process.env.MONGODB_DB || "decloud"
  const mongoClient = await getMongoClient()
  return mongoClient.db(databaseName)
}
