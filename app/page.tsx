"use client"

import { useState, useEffect } from "react"
import Header from "@/components/decloud/header"
import Hero from "@/components/decloud/hero"
import StatsBar from "@/components/decloud/stats-bar"
import UploadCard from "@/components/decloud/upload-card"
import FilesTabs from "@/components/decloud/files-tabs"
import FileGrid from "@/components/decloud/file-grid"
import ShareModal from "@/components/decloud/share-modal"
import WalletModal from "@/components/decloud/wallet-modal"
import Toast from "@/components/decloud/toast"
import { useDeCloudLogic, type FileRecord } from "@/lib/decloud-logic"

export default function Page() {
  const service = useDeCloudLogic()
  const [state, setState] = useState(service.getState())
  const [activeTab, setActiveTab] = useState<"my" | "shared">("my")
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

  useEffect(() => {
    service.hydrateFromStorage().then(setState)
  }, [service])

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }
  const handleConnect = async (provider: string) => {
    try {
      const newState = await service.connectWallet(provider as any)
      setState(newState)
      setShowWalletModal(false)
      showToast("success", `Connected with ${provider}`)
    } catch (err) {
      showToast("error", "Connection failed")
    }
  }

  const handleDisconnect = () => {
    service.disconnectWallet()
    setState(service.getState())
    showToast("success", "Wallet disconnected")
  }

  const handleUpload = async (files: File[]) => {
    if (!state.isConnected) {
      showToast("error", "Connect wallet first")
      return
    }
    setUploading(true)
    try {
      for (const file of files) {
        await service.uploadFile(file)
      }
      setState(service.getState())
      showToast("success", `${files.length} file(s) uploaded`)
    } catch (err) {
      showToast("error", "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = (id: number) => {
    service.deleteFile(id)
    setState(service.getState())
    showToast("success", "File deleted")
  }

  const handleDownload = (id: number) => {
    try {
      const { name, dataURL } = service.getDownloadPayload(id)
      const a = document.createElement("a")
      a.href = dataURL
      a.download = name
      a.click()
      showToast("success", "Download started")
    } catch (err) {
      showToast("error", "Download failed")
    }
  }

  const handleShare = (file: FileRecord) => {
    setSelectedFile(file)
    setShowShareModal(true)
  }

  const handleShareWithWallet = (wallet: string) => {
    if (!selectedFile) return
    try {
      service.shareWithWallet(selectedFile.id, wallet)
      setShowShareModal(false)
      setSelectedFile(null)
      showToast("success", "File shared")
    } catch (err) {
      showToast("error", "Share failed")
    }
  }

  const displayFiles = activeTab === "my" ? state.files : state.sharedFiles

  return (
    <main className="min-h-screen bg-black overflow-x-hidden">
      {/* Animated background noise overlay */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: "url(/placeholder.svg?height=1&width=1&query=noise)" }}
      />

      <Header
        isConnected={state.isConnected}
        walletAddress={state.walletAddress}
        onConnect={() => setShowWalletModal(true)}
        onDisconnect={handleDisconnect}
      />

      <Hero isConnected={state.isConnected} onConnect={() => setShowWalletModal(true)} />

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-12">
        <StatsBar stats={service.getStats()} />

        <UploadCard onUpload={handleUpload} uploading={uploading} disabled={!state.isConnected} />

        <div className="space-y-8">
          <FilesTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <FileGrid files={displayFiles} onShare={handleShare} onDownload={handleDownload} onDelete={handleDelete} />
        </div>
      </div>

      {showWalletModal && <WalletModal onConnect={handleConnect} onClose={() => setShowWalletModal(false)} />}

      {showShareModal && selectedFile && (
        <ShareModal
          file={selectedFile}
          onShare={handleShareWithWallet}
          onClose={() => {
            setShowShareModal(false)
            setSelectedFile(null)
          }}
        />
      )}

      {toast && <Toast type={toast.type} message={toast.message} />}
    </main>
  )
}
