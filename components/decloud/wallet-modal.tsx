"use client"

import { X, Loader2 } from "lucide-react"
import { useState } from "react"

interface WalletModalProps {
  onConnect: (provider: string) => void
  onClose: () => void
}

const providers = [
  { name: "MetaMask", emoji: "🦊" },
  { name: "Phantom", emoji: "👻" },
  { name: "Coinbase Wallet", emoji: "💙" },
  { name: "WalletConnect", emoji: "🔗" },
  { name: "Trust Wallet", emoji: "🛡️" },
  { name: "Rainbow", emoji: "🌈" },
]

export default function WalletModal({ onConnect, onClose }: WalletModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null)

  const handleConnect = async (provider: string) => {
    setConnecting(provider)
    try {
      await onConnect(provider)
    } finally {
      setConnecting(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass p-8 rounded-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Connect Wallet</h3>
          <button onClick={onClose} className="p-1 hover:bg-red-500/20 rounded-lg">
            <X size={20} className="text-red-400" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {providers.map((provider) => (
            <button
              key={provider.name}
              onClick={() => handleConnect(provider.name)}
              disabled={connecting === provider.name}
              className="p-4 glass-sm rounded-xl flex flex-col items-center gap-2 hover:border-pink-500/50 transition-all disabled:opacity-50"
            >
              {connecting === provider.name ? (
                <Loader2 size={20} className="text-purple-400 animate-spin" />
              ) : (
                <span className="text-2xl">{provider.emoji}</span>
              )}
              <p className="text-xs font-semibold text-center">{provider.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
