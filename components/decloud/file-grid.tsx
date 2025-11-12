"use client"

import { File, Download, Share2, Trash2 } from "lucide-react"
import { formatFileSize } from "@/lib/decloud-logic"
import type { FileRecord, SharedFileRecord } from "@/lib/decloud-logic"

interface FileGridProps {
  files: (FileRecord | SharedFileRecord)[]
  onShare: (file: FileRecord) => void
  onDownload: (id: number) => void
  onDelete: (id: number) => void
}

export default function FileGrid({ files, onShare, onDownload, onDelete }: FileGridProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No files yet. Start by uploading or receiving a file.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file) => (
        <div key={file.id} className="glass p-4 rounded-xl group hover:border-pink-500/50 transition-all">
          {/* File Icon & Name */}
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-gradient-primary flex-shrink-0">
              <File size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate text-sm">{file.name}</p>
              <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <span className="glass-sm px-2 py-1 text-xs text-emerald-400 rounded-md">Encrypted</span>
            {file.verified && <span className="glass-sm px-2 py-1 text-xs text-blue-400 rounded-md">Verified</span>}
          </div>

          {/* Blockchain Hash */}
          <div className="glass-sm p-2 rounded-lg mb-3 overflow-hidden">
            <p className="text-xs font-mono text-gray-500 truncate">{file.blockchainHash}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onDownload(file.id)}
              className="flex-1 p-2 rounded-lg hover:bg-blue-500/20 transition-colors"
              title="Download"
            >
              <Download size={16} className="text-blue-400 mx-auto" />
            </button>
            {"owner" in file && (
              <button
                onClick={() => onShare(file as FileRecord)}
                className="flex-1 p-2 rounded-lg hover:bg-purple-500/20 transition-colors"
                title="Share"
              >
                <Share2 size={16} className="text-purple-400 mx-auto" />
              </button>
            )}
            <button
              onClick={() => onDelete(file.id)}
              className="flex-1 p-2 rounded-lg hover:bg-red-500/20 transition-colors"
              title="Delete"
            >
              <Trash2 size={16} className="text-red-400 mx-auto" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
