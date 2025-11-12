"use client"

interface FilesTabsProps {
  activeTab: "my" | "shared"
  onTabChange: (tab: "my" | "shared") => void
}

export default function FilesTabs({ activeTab, onTabChange }: FilesTabsProps) {
  return (
    <div className="flex gap-8 border-b pb-4" style={{ borderColor: "rgba(168, 85, 247, 0.25)" }}>
      <button
        onClick={() => onTabChange("my")}
        className={`font-semibold text-sm pb-2 transition-all ${
          activeTab === "my" ? "text-purple-400 border-b-2 border-purple-400" : "text-gray-400 hover:text-gray-300"
        }`}
      >
        My Files
      </button>
      <button
        onClick={() => onTabChange("shared")}
        className={`font-semibold text-sm pb-2 transition-all ${
          activeTab === "shared" ? "text-purple-400 border-b-2 border-purple-400" : "text-gray-400 hover:text-gray-300"
        }`}
      >
        Shared with Me
      </button>
    </div>
  )
}
