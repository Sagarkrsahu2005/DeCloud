"use client"

import { FileText, Share2, CheckCircle2, HardDrive } from "lucide-react"

interface StatsBarProps {
  stats: {
    myFiles: number
    sharedWithMe: number
    verified: number
    totalSizeBytes: number
    totalSizePretty: string
  }
}

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={FileText} label="My Files" value={stats.myFiles} />
      <StatCard icon={Share2} label="Shared with Me" value={stats.sharedWithMe} />
      <StatCard icon={CheckCircle2} label="Verified" value={stats.verified} />
      <StatCard icon={HardDrive} label="Total Size" value={stats.totalSizePretty} isSize />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, isSize = false }: any) {
  return (
    <div className="glass p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-gradient-primary">
          <Icon size={20} className="text-white" />
        </div>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
      <p className={`font-bold ${isSize ? "text-lg" : "text-2xl"} text-white`}>{value}</p>
    </div>
  )
}
