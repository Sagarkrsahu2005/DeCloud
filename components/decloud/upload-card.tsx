"use client"

import type React from "react"

import { Upload, Loader2 } from "lucide-react"
import { useRef } from "react"

interface UploadCardProps {
  onUpload: (files: File[]) => void
  uploading: boolean
  disabled: boolean
}

export default function UploadCard({ onUpload, uploading, disabled }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled || uploading) return
    const files = Array.from(e.dataTransfer.files)
    onUpload(files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onUpload(Array.from(e.target.files))
    }
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={`glass p-12 rounded-2xl border-2 border-dashed border-purple-500/50 text-center cursor-pointer transition-all ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:border-pink-500"
      }`}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleChange}
        disabled={uploading || disabled}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-3">
        {uploading ? (
          <Loader2 size={32} className="text-purple-400 animate-spin" />
        ) : (
          <Upload size={32} className="text-purple-400" />
        )}
        <div>
          <p className="text-lg font-semibold text-white">{uploading ? "Uploading..." : "Drop files or click"}</p>
          <p className="text-sm text-gray-400">Any file type, encrypted end-to-end</p>
        </div>
      </div>
    </div>
  )
}
