"use client"

import { useEffect, useState } from "react"

interface HeroProps {
  isConnected: boolean
  onConnect: () => void
}

export default function Hero({ isConnected, onConnect }: HeroProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; duration: number }[]>([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: 15 + Math.random() * 15,
      })),
    )
  }, [])

  return (
    <section className="relative overflow-hidden py-24 px-4">
      {/* Parallax blob gradients */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-1 h-1 bg-purple-300 rounded-full opacity-60"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animation: `float ${p.duration}s ease-in-out infinite`,
          }}
        />
      ))}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.6; }
          25% { transform: translateY(-30px) translateX(20px); opacity: 0.8; }
          50% { transform: translateY(0px) translateX(40px); opacity: 0.6; }
          75% { transform: translateY(30px) translateX(20px); opacity: 0.4; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-5xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
          Store. Secure. Decentralized.
        </h2>
        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Keep your files encrypted on a distributed network. No central authority, pure control.
        </p>
        {!isConnected && (
          <button
            onClick={onConnect}
            className="px-8 py-4 rounded-lg font-bold text-lg gradient-primary text-white hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
          >
            Connect Your Wallet
          </button>
        )}
      </div>
    </section>
  )
}
