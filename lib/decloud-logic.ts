"use client"

import { useRef, useMemo, useSyncExternalStore } from "react"
import { BrowserProvider } from "ethers"

export type ProviderName = "MetaMask" | "Phantom" | "Coinbase Wallet" | "WalletConnect" | "Trust Wallet" | "Rainbow"

export interface FileRecord {
  id: number
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
  owner: string
  shareLink: string
}

export interface SharedFileRecord extends FileRecord {
  sharedBy: string
  sharedAt: string
  sharedKey?: string
}

export interface DeCloudState {
  walletAddress: string
  isConnected: boolean
  files: FileRecord[]
  sharedFiles: SharedFileRecord[]
}

const LS_WALLET = "decloud_wallet"
const LS_PROVIDER = "decloud_provider"
const LS_ALL_FILES = "decloud_all_files"
const LS_SHARED_FILES = "decloud_shared_files"
const LS_FILE_KEYS = "decloud_file_keys"
const LS_SELF_DESTRUCT_LINKS = "decloud_self_destruct_links"

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export const generateShareLink = () => `decloud.io/share/${randomToken(10)}`

export const generateBlockchainHash = async (name: string, size: number, cipherPreview: string, now = Date.now()) => {
  const payload = `${name}:${size}:${now}:${cipherPreview.slice(0, 64)}`
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload))
  return `0x${Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`
}

interface SelfDestructLinkMeta {
  fileId: number
  owner: string
  expiresAt: string
  remainingViews: number
}

interface LinkOptions {
  expiresInHours?: number
  maxViews?: number
}

// ===== IndexedDB Storage Setup =====
const DB_NAME = "decloud_storage"
const STORE_FILES = "files"
const STORE_KEYS = "keys"
const STORE_LINKS = "links"
const FILES_API = "/api/files"

let db: IDBDatabase | null = null

async function initDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(STORE_FILES)) {
        database.createObjectStore(STORE_FILES)
      }
      if (!database.objectStoreNames.contains(STORE_KEYS)) {
        database.createObjectStore(STORE_KEYS)
      }
      if (!database.objectStoreNames.contains(STORE_LINKS)) {
        database.createObjectStore(STORE_LINKS)
      }
    }
  })
}

async function readAllFiles(): Promise<Record<string, FileRecord[]>> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_FILES], "readonly")
    const request = transaction.objectStore(STORE_FILES).get("all_files")
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || {})
  })
}

async function writeAllFiles(map: Record<string, FileRecord[]>): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_FILES], "readwrite")
    const request = transaction.objectStore(STORE_FILES).put(map, "all_files")
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => resolve()
  })
}

async function readAllShared(): Promise<Record<string, SharedFileRecord[]>> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_FILES], "readonly")
    const request = transaction.objectStore(STORE_FILES).get("shared_files")
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || {})
  })
}

async function writeAllShared(map: Record<string, SharedFileRecord[]>): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_FILES], "readwrite")
    const request = transaction.objectStore(STORE_FILES).put(map, "shared_files")
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => resolve()
  })
}

async function readKeyStore(): Promise<Record<string, Record<string, string>>> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_KEYS], "readonly")
    const request = transaction.objectStore(STORE_KEYS).get("key_store")
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || {})
  })
}

async function writeKeyStore(store: Record<string, Record<string, string>>): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_KEYS], "readwrite")
    const request = transaction.objectStore(STORE_KEYS).put(store, "key_store")
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => resolve()
  })
}

async function readSelfDestructLinks(): Promise<Record<string, SelfDestructLinkMeta>> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_LINKS], "readonly")
    const request = transaction.objectStore(STORE_LINKS).get("links_store")
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || {})
  })
}

async function writeSelfDestructLinks(map: Record<string, SelfDestructLinkMeta>): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_LINKS], "readwrite")
    const request = transaction.objectStore(STORE_LINKS).put(map, "links_store")
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => resolve()
  })
}

async function fetchRemoteFiles(): Promise<FileRecord[]> {
  try {
    const response = await fetch(FILES_API, { credentials: "include" })
    if (!response.ok) return []
    const payload = (await response.json()) as { files?: FileRecord[] }
    return Array.isArray(payload.files) ? payload.files : []
  } catch {
    return []
  }
}

async function syncRemoteFile(record: FileRecord): Promise<void> {
  try {
    await fetch(FILES_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(record),
    })
  } catch (error) {
    console.warn("Mongo sync skipped for file upload:", error)
  }
}

async function deleteRemoteFile(id: number): Promise<void> {
  try {
    await fetch(`${FILES_API}?id=${id}`, {
      method: "DELETE",
      credentials: "include",
    })
  } catch (error) {
    console.warn("Mongo sync skipped for file delete:", error)
  }
}

function mergeFiles(primary: FileRecord[], fallback: FileRecord[]) {
  const merged = new Map<number, FileRecord>()
  for (const file of fallback) merged.set(file.id, file)
  for (const file of primary) merged.set(file.id, file)
  return Array.from(merged.values()).sort((a, b) => b.id - a.id)
}

const randomToken = (bytes = 16) => {
  const arr = crypto.getRandomValues(new Uint8Array(bytes))
  return base64UrlEncode(arr)
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToBytes(base64: string) {
  const binary = atob(base64)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  return arr
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function base64UrlEncode(bytes: Uint8Array) {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function parseHashParam(url: URL, key: string) {
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash
  const params = new URLSearchParams(hash)
  return params.get(key)
}

async function encryptBytesAESGCM(data: ArrayBuffer, rawKey: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", toArrayBuffer(rawKey), { name: "AES-GCM" }, false, ["encrypt"])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data)
  return {
    encryptedData: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  }
}

async function decryptBytesAESGCM(encryptedData: string, iv: string, rawKeyBase64: string) {
  const keyBytes = base64ToBytes(rawKeyBase64)
  const key = await crypto.subtle.importKey("raw", toArrayBuffer(keyBytes), { name: "AES-GCM" }, false, ["decrypt"])
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    key,
    base64ToBytes(encryptedData),
  )
  return new Uint8Array(decrypted)
}

function bytesToDataURL(bytes: Uint8Array, mimeType: string) {
  return `data:${mimeType || "application/octet-stream"};base64,${bytesToBase64(bytes)}`
}

const fileKeyId = (fileId: number) => String(fileId)

export class DeCloudService {
  private state: DeCloudState = {
    walletAddress: "",
    isConnected: false,
    files: [],
    sharedFiles: [],
  }

  getState(): DeCloudState {
    return JSON.parse(JSON.stringify(this.state))
  }

  async hydrateFromStorage() {
    const sessionResponse = await fetch("/api/auth/session", { credentials: "include" })
    if (!sessionResponse.ok) return this.getState()
    const sessionPayload = (await sessionResponse.json()) as { address?: string }
    const wallet = sessionPayload.address
    if (!wallet) return this.getState()

    const allFiles = await readAllFiles()
    const allShared = await readAllShared()
    const remoteFiles = await fetchRemoteFiles()

    this.state.walletAddress = wallet
    this.state.isConnected = true
    this.state.files = mergeFiles(remoteFiles, allFiles[wallet] || [])
    this.state.sharedFiles = allShared[wallet] || []
    localStorage.setItem(LS_WALLET, wallet)
    return this.getState()
  }

  async connectWallet(provider: ProviderName) {
    await new Promise((r) => setTimeout(r, 800))
    if (typeof window === "undefined" || !(window as Window & { ethereum?: unknown }).ethereum) {
      throw new Error("WALLET_PROVIDER_NOT_FOUND")
    }

    const ethereum = (window as unknown as Window & { ethereum: any }).ethereum
    const browserProvider = new BrowserProvider(ethereum)
    await browserProvider.send("eth_requestAccounts", [])
    const signer = await browserProvider.getSigner()
    const address = await signer.getAddress()

    const nonceResponse = await fetch("/api/auth/nonce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, provider }),
    })
    if (!nonceResponse.ok) throw new Error("AUTH_NONCE_FAILED")

    const noncePayload = (await nonceResponse.json()) as { message?: string }
    if (!noncePayload.message) throw new Error("AUTH_MESSAGE_MISSING")

    const signature = await signer.signMessage(noncePayload.message)
    const verifyResponse = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ address, signature }),
    })
    if (!verifyResponse.ok) throw new Error("AUTH_SIGNATURE_FAILED")

    this.state.walletAddress = address
    this.state.isConnected = true
    localStorage.setItem(LS_WALLET, address)
    localStorage.setItem(LS_PROVIDER, provider)

    const allFiles = await readAllFiles()
    const allShared = await readAllShared()
    const remoteFiles = await fetchRemoteFiles()
    this.state.files = mergeFiles(remoteFiles, allFiles[address] || [])
    this.state.sharedFiles = allShared[address] || []
    return this.getState()
  }

  async disconnectWallet() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    } catch {
      // Ignore logout failures.
    }
    this.state = { walletAddress: "", isConnected: false, files: [], sharedFiles: [] }
    localStorage.removeItem(LS_WALLET)
    localStorage.removeItem(LS_PROVIDER)
    return this.getState()
  }

  async uploadFile(file: File) {
    if (!this.state.isConnected) throw new Error("WALLET_NOT_CONNECTED")
    if (!file) throw new Error("NO_FILE")

    // Check file size (max 10MB per file)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`FILE_TOO_LARGE: Max file size is 10MB, got ${(file.size / (1024 * 1024)).toFixed(2)}MB`)
    }

    try {
      await new Promise((r) => setTimeout(r, 800))
      const buffer = await fileToArrayBuffer(file)
      const rawKey = crypto.getRandomValues(new Uint8Array(32))
      const { encryptedData, iv } = await encryptBytesAESGCM(buffer, rawKey)
      const hash = await generateBlockchainHash(file.name, file.size, encryptedData)

      const id = Date.now()

      const keys = await readKeyStore()
      const wallet = this.state.walletAddress
      keys[wallet] = keys[wallet] || {}
      keys[wallet][fileKeyId(id)] = bytesToBase64(rawKey)
      
      try {
        await writeKeyStore(keys)
      } catch (e) {
        throw new Error(`STORAGE_WRITE_KEY_FAILED: ${(e as Error).message}`)
      }

      const record: FileRecord = {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        encryptedData,
        iv,
        uploadDate: new Date().toISOString(),
        blockchainHash: hash,
        encrypted: true,
        verified: true,
        owner: this.state.walletAddress,
        shareLink: "",
      }

      const allFiles = await readAllFiles()
      const updated = [record, ...(allFiles[wallet] || [])]
      allFiles[wallet] = updated
      
      try {
        await writeAllFiles(allFiles)
      } catch (e) {
        throw new Error(`STORAGE_WRITE_FILES_FAILED: ${(e as Error).message}`)
      }

      await syncRemoteFile(record)

      this.state.files = updated

      // Generate self-destruct link AFTER file is in state
      try {
        record.shareLink = await this.createSelfDestructLink(record.id, { expiresInHours: 24, maxViews: 1 })
        const updatedFiles = await readAllFiles()
        updatedFiles[wallet] = updatedFiles[wallet].map((f) => (f.id === record.id ? record : f))
        await writeAllFiles(updatedFiles)
        this.state.files = updatedFiles[wallet]
      } catch (e) {
        console.error("Failed to generate self-destruct link:", e)
        // Continue without link if it fails
      }

      return record
    } catch (err) {
      if (err instanceof Error && err.message.includes("STORAGE_")) {
        throw err
      }
      throw new Error(`UPLOAD_FAILED: ${(err as Error).message}`)
    }
  }

  async deleteFile(id: number) {
    if (!this.state.isConnected) throw new Error("WALLET_NOT_CONNECTED")
    const wallet = this.state.walletAddress

    const allFiles = await readAllFiles()
    const current = allFiles[wallet] || []
    const updated = current.filter((f) => f.id !== id)
    allFiles[wallet] = updated
    await writeAllFiles(allFiles)
    await deleteRemoteFile(id)

    const keyStore = await readKeyStore()
    if (keyStore[wallet]?.[fileKeyId(id)]) {
      delete keyStore[wallet][fileKeyId(id)]
      await writeKeyStore(keyStore)
    }

    const links = await readSelfDestructLinks()
    for (const token of Object.keys(links)) {
      const meta = links[token]
      if (meta.owner === wallet && meta.fileId === id) delete links[token]
    }
    await writeSelfDestructLinks(links)

    this.state.files = updated
    return this.getState()
  }

  async getDownloadPayload(id: number) {
    const ownFile = this.state.files.find((f) => f.id === id)
    const sharedFile = this.state.sharedFiles.find((f) => f.id === id)
    const file = ownFile || sharedFile
    if (!file) throw new Error("FILE_NOT_FOUND")

    // Backward compatibility for old records.
    if (file.data) return { name: file.name, dataURL: file.data }

    if (!file.encryptedData || !file.iv) throw new Error("MISSING_ENCRYPTED_PAYLOAD")

    let keyBase64: string | undefined
    if (ownFile) {
      const keyStore = await readKeyStore()
      keyBase64 = keyStore[this.state.walletAddress]?.[fileKeyId(file.id)]
    } else {
      keyBase64 = (sharedFile as SharedFileRecord | undefined)?.sharedKey
    }

    if (!keyBase64) throw new Error("MISSING_DECRYPTION_KEY")
    const bytes = await decryptBytesAESGCM(file.encryptedData, file.iv, keyBase64)
    return { name: file.name, dataURL: bytesToDataURL(bytes, file.type) }
  }

  async shareWithWallet(fileId: number, recipientWallet: string) {
    if (!this.state.isConnected) throw new Error("WALLET_NOT_CONNECTED")
    if (!/^0x[a-fA-F0-9]{4,}$/.test(recipientWallet)) throw new Error("INVALID_WALLET")

    const file = this.state.files.find((f) => f.id === fileId)
    if (!file) throw new Error("FILE_NOT_FOUND")

    const keyStore = await readKeyStore()
    const senderKey = keyStore[this.state.walletAddress]?.[fileKeyId(file.id)]
    if (!senderKey) throw new Error("MISSING_DECRYPTION_KEY")

    const allShared = await readAllShared()
    const payload: SharedFileRecord = {
      ...file,
      sharedBy: this.state.walletAddress,
      sharedAt: new Date().toISOString(),
      sharedKey: senderKey,
    }

    allShared[recipientWallet] = [...(allShared[recipientWallet] || []), payload]
    await writeAllShared(allShared)

    return { recipient: recipientWallet, fileId }
  }

  async refreshSharedInbox() {
    if (!this.state.isConnected) throw new Error("WALLET_NOT_CONNECTED")
    const allShared = await readAllShared()
    this.state.sharedFiles = allShared[this.state.walletAddress] || []
    return this.state.sharedFiles.slice()
  }

  getStats() {
    const totalSize = this.state.files.reduce((acc, f) => acc + f.size, 0)
    return {
      myFiles: this.state.files.length,
      sharedWithMe: this.state.sharedFiles.length,
      verified: this.state.files.filter((f) => f.verified).length,
      totalSizeBytes: totalSize,
      totalSizePretty: formatFileSize(totalSize),
    }
  }

  async createSelfDestructLink(fileId: number, options: LinkOptions = {}) {
    if (!this.state.isConnected) throw new Error("WALLET_NOT_CONNECTED")

    const file = this.state.files.find((f) => f.id === fileId)
    if (!file) throw new Error("FILE_NOT_FOUND")

    const keyStore = await readKeyStore()
    const wallet = this.state.walletAddress
    const keyBase64 = keyStore[wallet]?.[fileKeyId(fileId)]
    if (!keyBase64) throw new Error("MISSING_DECRYPTION_KEY")

    const expiresInHours = Math.max(1, options.expiresInHours ?? 24)
    const maxViews = Math.max(1, options.maxViews ?? 1)

    const token = randomToken(16)
    const links = await readSelfDestructLinks()
    links[token] = {
      fileId,
      owner: wallet,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString(),
      remainingViews: maxViews,
    }
    await writeSelfDestructLinks(links)

    const origin = typeof window !== "undefined" ? window.location.origin : "https://decloud.local"
    return `${origin}/?share=${token}#k=${encodeURIComponent(keyBase64)}`
  }

  async consumeShareLinkFromUrl(urlStr: string) {
    const url = new URL(urlStr)
    const token = url.searchParams.get("share")
    const keyBase64 = parseHashParam(url, "k")
    if (!token || !keyBase64) throw new Error("INVALID_SHARE_LINK")

    const links = await readSelfDestructLinks()
    const meta = links[token]
    if (!meta) throw new Error("LINK_NOT_FOUND")

    if (new Date(meta.expiresAt).getTime() < Date.now()) {
      delete links[token]
      await writeSelfDestructLinks(links)
      throw new Error("LINK_EXPIRED")
    }

    if (meta.remainingViews <= 0) {
      delete links[token]
      await writeSelfDestructLinks(links)
      throw new Error("LINK_DESTROYED")
    }

    const allFiles = await readAllFiles()
    const ownerFiles = allFiles[meta.owner] || []
    const file = ownerFiles.find((f) => f.id === meta.fileId)
    if (!file) throw new Error("FILE_NOT_FOUND")

    let dataURL: string
    if (file.data) {
      dataURL = file.data
    } else {
      if (!file.encryptedData || !file.iv) throw new Error("MISSING_ENCRYPTED_PAYLOAD")
      const bytes = await decryptBytesAESGCM(file.encryptedData, file.iv, decodeURIComponent(keyBase64))
      dataURL = bytesToDataURL(bytes, file.type)
    }

    meta.remainingViews -= 1
    if (meta.remainingViews <= 0) {
      delete links[token]
    } else {
      links[token] = meta
    }
    await writeSelfDestructLinks(links)

    return {
      name: file.name,
      dataURL,
      remainingViews: Math.max(0, meta.remainingViews),
    }
  }
}

function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("FILE_OBJECT_IS_NULL"))
      return
    }
    if (!file.name || file.size === undefined) {
      reject(new Error("FILE_OBJECT_INVALID_PROPERTIES"))
      return
    }
    const reader = new FileReader()
    reader.onerror = (event) => {
      const errorCode = (event.target as FileReader).error?.name || "UNKNOWN_ERROR"
      reject(new Error(`READ_FAIL: ${errorCode}`))
    }
    reader.onload = () => {
      if (!reader.result) {
        reject(new Error("READ_RESULT_IS_NULL"))
        return
      }
      resolve(reader.result as ArrayBuffer)
    }
    reader.onabort = () => reject(new Error("READ_ABORTED"))
    
    try {
      reader.readAsArrayBuffer(file)
    } catch (e) {
      reject(new Error(`READ_INIT_FAILED: ${(e as Error).message}`))
    }
  })
}

export function useDeCloudLogic() {
  const svcRef = useRef<DeCloudService | null>(null)
  if (!svcRef.current) svcRef.current = new DeCloudService()

  const service = svcRef.current
  const versionRef = useRef(0)
  const listeners = useRef(new Set<() => void>())

  const emit = () => listeners.current.forEach((l) => l())
  const bump = () => {
    versionRef.current++
    emit()
  }

  const subscribe = (cb: () => void) => {
    listeners.current.add(cb)
    return () => listeners.current.delete(cb)
  }
  const getSnapshot = () => versionRef.current

  const api = useMemo(() => {
    const wrap = <T extends any[], R>(fn: (...args: T) => R | Promise<R>) => {
      return async (...args: T) => {
        const res = await fn.apply(service, args)
        bump()
        return res
      }
    }

    return {
      getState: () => service.getState(),
      hydrateFromStorage: wrap(service.hydrateFromStorage.bind(service)),
      connectWallet: wrap(service.connectWallet.bind(service)),
      disconnectWallet: wrap(service.disconnectWallet.bind(service)),
      uploadFile: wrap(service.uploadFile.bind(service)),
      deleteFile: wrap(service.deleteFile.bind(service)),
      getDownloadPayload: wrap(service.getDownloadPayload.bind(service)),
      shareWithWallet: wrap(service.shareWithWallet.bind(service)),
      refreshSharedInbox: wrap(service.refreshSharedInbox.bind(service)),
      createSelfDestructLink: wrap(service.createSelfDestructLink.bind(service)),
      consumeShareLinkFromUrl: wrap(service.consumeShareLinkFromUrl.bind(service)),
      getStats: () => service.getStats(),
    }
  }, [])

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return api
}
