"use client"

import { CheckCircle2, AlertCircle, Info } from "lucide-react"

interface ToastProps {
  type: "success" | "error" | "info"
  message: string
}

export default function Toast({ type, message }: ToastProps) {
  const icons = {
    success: <CheckCircle2 size={20} className="text-emerald-400" />,
    error: <AlertCircle size={20} className="text-red-400" />,
    info: <Info size={20} className="text-blue-400" />,
  }

  return (
    <div className="fixed top-6 right-6 z-[999] glass p-4 rounded-xl flex items-center gap-3 max-w-sm">
      {icons[type]}
      <p className="text-sm text-white">{message}</p>
    </div>
  )
}
