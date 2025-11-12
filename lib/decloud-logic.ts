"use client"

import { useRef, useMemo, useSyncExternalStore } from "react"

export type ProviderName = "MetaMask" | "Phantom" | "Coinbase Wallet" | "WalletConnect" | "Trust Wallet" | "Rainbow"

export interface FileRecord {
  id: number
  name: string
  size: number
  type: string
  data: string
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

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export const generateShareLink = () => `decloud.io/share/${Math.random().toString(36).slice(2, 14)}`

export const generateBlockchainHash = (name: string, size: number, now = Date.now()) => {
  const str = `${name}${size}${now}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, "0")}`
}

const readAllFiles = (): Record<string, FileRecord[]> => JSON.parse(localStorage.getItem(LS_ALL_FILES) || "{}")

const writeAllFiles = (map: Record<string, FileRecord[]>) => localStorage.setItem(LS_ALL_FILES, JSON.stringify(map))

const readAllShared = (): Record<string, SharedFileRecord[]> =>
  JSON.parse(localStorage.getItem(LS_SHARED_FILES) || "{}")

const writeAllShared = (map: Record<string, SharedFileRecord[]>) =>
  localStorage.setItem(LS_SHARED_FILES, JSON.stringify(map))

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
    const data = await fileToDataURL(file)

    const record: FileRecord = {
      id: Date.now(),
      name: file.name,
      size: file.size,
      type: file.type,
      data,
      uploadDate: new Date().toISOString(),
      blockchainHash: generateBlockchainHash(file.name, file.size),
      encrypted: true,
      verified: true,
      owner: this.state.walletAddress,
      shareLink: generateShareLink(),
    }

    const allFiles = readAllFiles()
    const wallet = this.state.walletAddress
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

    this.state.files = updated
    return this.getState()
  }

  getDownloadPayload(id: number) {
    const file = this.state.files.find((f) => f.id === id)
    if (!file) throw new Error("FILE_NOT_FOUND")
    return { name: file.name, dataURL: file.data }
  }

  shareWithWallet(fileId: number, recipientWallet: string) {
    if (!this.state.isConnected) throw new Error("WALLET_NOT_CONNECTED")
    if (!/^0x[a-fA-F0-9]{4,}$/.test(recipientWallet)) throw new Error("INVALID_WALLET")

    const file = this.state.files.find((f) => f.id === fileId)
    if (!file) throw new Error("FILE_NOT_FOUND")

    const allShared = readAllShared()
    const payload: SharedFileRecord = {
      ...file,
      sharedBy: this.state.walletAddress,
      sharedAt: new Date().toISOString(),
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
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("READ_FAIL"))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
}

export function useDeCloudLogic() {
  const svcRef = useRef<DeCloudService>()
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
      getDownloadPayload: service.getDownloadPayload.bind(service),
      shareWithWallet: wrap(service.shareWithWallet.bind(service)),
      refreshSharedInbox: wrap(service.refreshSharedInbox.bind(service)),
      getStats: () => service.getStats(),
    }
  }, [])

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return api
}
