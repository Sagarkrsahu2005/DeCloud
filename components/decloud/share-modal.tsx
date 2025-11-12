"use client"

import { Copy, Check, X } from "lucide-react"
import { useState } from "react"
import type { FileRecord } from "@/lib/decloud-logic"

interface ShareModalProps {
  file: FileRecord
  onShare: (wallet: string) => void
  onClose: () => void
}

export default function ShareModal({ file, onShare, onClose }: ShareModalProps) {
  const [wallet, setWallet] = useState("")
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(file.shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    if (wallet.trim()) {
      onShare(wallet.trim())
      setWallet("")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass p-6 rounded-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Share: {file.name}</h3>
          <button onClick={onClose} className="p-1 hover:bg-red-500/20 rounded-lg">
            <X size={20} className="text-red-400" />
          </button>
        </div>

        {/* Public Link */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-2">Public Share Link</p>
          <div className="glass-sm p-3 rounded-lg flex items-center gap-2">
            <input
              type="text"
              value={file.shareLink}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-300 font-mono outline-none"
            />
            <button onClick={handleCopy} className="p-1 hover:bg-purple-500/20 rounded-lg transition-colors">
              {copied ? (
                <Check size={16} className="text-emerald-400" />
              ) : (
                <Copy size={16} className="text-purple-400" />
              )}
            </button>
          </div>
        </div>

        {/* Share with Wallet */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-2">Share with Wallet Address</p>
          <input
            type="text"
            placeholder="0x..."
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className="w-full glass-sm p-3 rounded-lg text-sm text-white placeholder-gray-600 outline-none focus-ring"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 font-semibold hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={!wallet.trim()}
            className="flex-1 px-4 py-2 rounded-lg gradient-primary text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
          >
            Share
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">Recipient must connect their wallet to access</p>
      </div>
    </div>
  )
}
