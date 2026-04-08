"use client"

import { Copy, Check, X } from "lucide-react"
import { useState } from "react"
import type { FileRecord } from "@/lib/decloud-logic"

interface ShareModalProps {
  file: FileRecord
  onShare: (wallet: string) => void
  onGenerateLink: (fileId: number, options: { expiresInHours: number; maxViews: number }) => Promise<string>
  onClose: () => void
}

export default function ShareModal({ file, onShare, onGenerateLink, onClose }: ShareModalProps) {
  const [wallet, setWallet] = useState("")
  const [copied, setCopied] = useState(false)
  const [expiresInHours, setExpiresInHours] = useState(24)
  const [maxViews, setMaxViews] = useState(1)
  const [generatedLink, setGeneratedLink] = useState(file.shareLink)
  const [generating, setGenerating] = useState(false)

  const shareLink = generatedLink || file.shareLink

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerateLink = async () => {
    setGenerating(true)
    try {
      const link = await onGenerateLink(file.id, {
        expiresInHours: Math.max(1, expiresInHours),
        maxViews: Math.max(1, maxViews),
      })
      setGeneratedLink(link)
    } finally {
      setGenerating(false)
    }
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

        {/* Self-destruct Link */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-2">Self-destruct Access Link</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="number"
              min={1}
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(Number(e.target.value || 1))}
              className="glass-sm p-2 rounded-lg text-sm text-white placeholder-gray-500 outline-none"
              placeholder="Expires (hours)"
            />
            <input
              type="number"
              min={1}
              value={maxViews}
              onChange={(e) => setMaxViews(Number(e.target.value || 1))}
              className="glass-sm p-2 rounded-lg text-sm text-white placeholder-gray-500 outline-none"
              placeholder="Max views"
            />
          </div>
          <button
            onClick={handleGenerateLink}
            disabled={generating}
            className="w-full mb-2 px-3 py-2 rounded-lg bg-white/10 text-sm text-white hover:bg-white/15 transition-colors disabled:opacity-60"
          >
            {generating ? "Generating secure link..." : "Generate Secure Link"}
          </button>
          <div className="glass-sm p-3 rounded-lg flex items-center gap-2">
            <input
              type="text"
              value={shareLink}
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

        <p className="text-xs text-gray-500 mt-4 text-center">
          Encryption key is embedded in URL fragment only; servers never receive it.
        </p>
      </div>
    </div>
  )
}
