"use client"

import { useRef, useMemo, useSyncExternalStore } from "react"

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

const readAllFiles = (): Record<string, FileRecord[]> => JSON.parse(localStorage.getItem(LS_ALL_FILES) || "{}")

const writeAllFiles = (map: Record<string, FileRecord[]>) => localStorage.setItem(LS_ALL_FILES, JSON.stringify(map))

const readAllShared = (): Record<string, SharedFileRecord[]> =>
  JSON.parse(localStorage.getItem(LS_SHARED_FILES) || "{}")

const writeAllShared = (map: Record<string, SharedFileRecord[]>) =>
  localStorage.setItem(LS_SHARED_FILES, JSON.stringify(map))

const readKeyStore = (): Record<string, Record<string, string>> => JSON.parse(localStorage.getItem(LS_FILE_KEYS) || "{}")

const writeKeyStore = (store: Record<string, Record<string, string>>) => localStorage.setItem(LS_FILE_KEYS, JSON.stringify(store))

const readSelfDestructLinks = (): Record<string, SelfDestructLinkMeta> =>
  JSON.parse(localStorage.getItem(LS_SELF_DESTRUCT_LINKS) || "{}")

const writeSelfDestructLinks = (map: Record<string, SelfDestructLinkMeta>) =>
  localStorage.setItem(LS_SELF_DESTRUCT_LINKS, JSON.stringify(map))

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

  hydrateFromStorage() {
    const wallet = localStorage.getItem(LS_WALLET)
    if (!wallet) return this.getState()

    const allFiles = readAllFiles()
    const allShared = readAllShared()

    this.state.walletAddress = wallet
    this.state.isConnected = true
    this.state.files = allFiles[wallet] || []
    this.state.sharedFiles = allShared[wallet] || []
    return this.getState()
  }

  async connectWallet(provider: ProviderName) {
    await new Promise((r) => setTimeout(r, 800))
    const mock = `0x${Math.random().toString(16).slice(2).padEnd(40, "0").slice(0, 40)}`

    this.state.walletAddress = mock
    this.state.isConnected = true
    localStorage.setItem(LS_WALLET, mock)
    localStorage.setItem(LS_PROVIDER, provider)

    const allFiles = readAllFiles()
    const allShared = readAllShared()
    this.state.files = allFiles[mock] || []
    this.state.sharedFiles = allShared[mock] || []
    return this.getState()
  }

  disconnectWallet() {
    this.state = { walletAddress: "", isConnected: false, files: [], sharedFiles: [] }
    localStorage.removeItem(LS_WALLET)
    localStorage.removeItem(LS_PROVIDER)
    return this.getState()
  }

  async uploadFile(file: File) {
    if (!this.state.isConnected) throw new Error("WALLET_NOT_CONNECTED")
    if (!file) throw new Error("NO_FILE")

    await new Promise((r) => setTimeout(r, 800))
    const buffer = await fileToArrayBuffer(file)
    const rawKey = crypto.getRandomValues(new Uint8Array(32))
    const { encryptedData, iv } = await encryptBytesAESGCM(buffer, rawKey)
    const hash = await generateBlockchainHash(file.name, file.size, encryptedData)

    const id = Date.now()

    const keys = readKeyStore()
    const wallet = this.state.walletAddress
    keys[wallet] = keys[wallet] || {}
    keys[wallet][fileKeyId(id)] = bytesToBase64(rawKey)
    writeKeyStore(keys)

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

    record.shareLink = this.createSelfDestructLink(record.id, { expiresInHours: 24, maxViews: 1 })

    const allFiles = readAllFiles()
    const updated = [record, ...(allFiles[wallet] || [])]
    allFiles[wallet] = updated
    writeAllFiles(allFiles)

    this.state.files = updated
    return record
  }

  deleteFile(id: number) {
    if (!this.state.isConnected) throw new Error("WALLET_NOT_CONNECTED")
    const wallet = this.state.walletAddress

    const allFiles = readAllFiles()
    const current = allFiles[wallet] || []
    const updated = current.filter((f) => f.id !== id)
    allFiles[wallet] = updated
    writeAllFiles(allFiles)

    const keyStore = readKeyStore()
    if (keyStore[wallet]?.[fileKeyId(id)]) {
      delete keyStore[wallet][fileKeyId(id)]
      writeKeyStore(keyStore)
    }

    const links = readSelfDestructLinks()
    for (const token of Object.keys(links)) {
      const meta = links[token]
      if (meta.owner === wallet && meta.fileId === id) delete links[token]
    }
    writeSelfDestructLinks(links)

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
      const keyStore = readKeyStore()
      keyBase64 = keyStore[this.state.walletAddress]?.[fileKeyId(file.id)]
    } else {
      keyBase64 = (sharedFile as SharedFileRecord | undefined)?.sharedKey
    }

    if (!keyBase64) throw new Error("MISSING_DECRYPTION_KEY")
    const bytes = await decryptBytesAESGCM(file.encryptedData, file.iv, keyBase64)
    return { name: file.name, dataURL: bytesToDataURL(bytes, file.type) }
  }

  shareWithWallet(fileId: number, recipientWallet: string) {
    if (!this.state.isConnected) throw new Error("WALLET_NOT_CONNECTED")
    if (!/^0x[a-fA-F0-9]{4,}$/.test(recipientWallet)) throw new Error("INVALID_WALLET")

    const file = this.state.files.find((f) => f.id === fileId)
    if (!file) throw new Error("FILE_NOT_FOUND")

    const keyStore = readKeyStore()
    const senderKey = keyStore[this.state.walletAddress]?.[fileKeyId(file.id)]
    if (!senderKey) throw new Error("MISSING_DECRYPTION_KEY")

    const allShared = readAllShared()
    const payload: SharedFileRecord = {
      ...file,
      sharedBy: this.state.walletAddress,
      sharedAt: new Date().toISOString(),
      sharedKey: senderKey,
    }

    allShared[recipientWallet] = [...(allShared[recipientWallet] || []), payload]
    writeAllShared(allShared)

    return { recipient: recipientWallet, fileId }
  }

  refreshSharedInbox() {
    if (!this.state.isConnected) throw new Error("WALLET_NOT_CONNECTED")
    const allShared = readAllShared()
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

  createSelfDestructLink(fileId: number, options: LinkOptions = {}) {
    if (!this.state.isConnected) throw new Error("WALLET_NOT_CONNECTED")

    const file = this.state.files.find((f) => f.id === fileId)
    if (!file) throw new Error("FILE_NOT_FOUND")

    const keyStore = readKeyStore()
    const wallet = this.state.walletAddress
    const keyBase64 = keyStore[wallet]?.[fileKeyId(fileId)]
    if (!keyBase64) throw new Error("MISSING_DECRYPTION_KEY")

    const expiresInHours = Math.max(1, options.expiresInHours ?? 24)
    const maxViews = Math.max(1, options.maxViews ?? 1)

    const token = randomToken(16)
    const links = readSelfDestructLinks()
    links[token] = {
      fileId,
      owner: wallet,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString(),
      remainingViews: maxViews,
    }
    writeSelfDestructLinks(links)

    const origin = typeof window !== "undefined" ? window.location.origin : "https://decloud.local"
    return `${origin}/?share=${token}#k=${encodeURIComponent(keyBase64)}`
  }

  async consumeShareLinkFromUrl(urlStr: string) {
    const url = new URL(urlStr)
    const token = url.searchParams.get("share")
    const keyBase64 = parseHashParam(url, "k")
    if (!token || !keyBase64) throw new Error("INVALID_SHARE_LINK")

    const links = readSelfDestructLinks()
    const meta = links[token]
    if (!meta) throw new Error("LINK_NOT_FOUND")

    if (new Date(meta.expiresAt).getTime() < Date.now()) {
      delete links[token]
      writeSelfDestructLinks(links)
      throw new Error("LINK_EXPIRED")
    }

    if (meta.remainingViews <= 0) {
      delete links[token]
      writeSelfDestructLinks(links)
      throw new Error("LINK_DESTROYED")
    }

    const allFiles = readAllFiles()
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
    writeSelfDestructLinks(links)

    return {
      name: file.name,
      dataURL,
      remainingViews: Math.max(0, meta.remainingViews),
    }
  }
}

function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("READ_FAIL"))
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.readAsArrayBuffer(file)
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
