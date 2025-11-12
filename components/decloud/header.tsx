"use client"

import { Database, LogOut } from "lucide-react"

interface HeaderProps {
  isConnected: boolean
  walletAddress: string
  onConnect: () => void
  onDisconnect: () => void
}

export default function Header({ isConnected, walletAddress, onConnect, onDisconnect }: HeaderProps) {
  const shortAddress = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ""

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo + Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Database size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">DeCloud</h1>
            <p className="text-xs text-gray-400">Decentralized Storage</p>
          </div>
        </div>

        {/* Right: Wallet Pill + Status */}
        <div className="flex items-center gap-4">
          {isConnected && (
            <>
              <div className="glass-sm px-3 py-2">
                <p className="text-xs font-mono text-gray-300">{shortAddress}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 glass-sm">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-400 font-semibold">Active</span>
              </div>
              <button onClick={onDisconnect} className="p-2 hover:bg-red-500/10 rounded-lg transition-all">
                <LogOut size={18} className="text-red-400" />
              </button>
            </>
          )}
          {!isConnected && (
            <button
              onClick={onConnect}
              className="px-6 py-2 rounded-lg font-semibold text-sm gradient-primary text-white hover:scale-105 transition-transform"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
