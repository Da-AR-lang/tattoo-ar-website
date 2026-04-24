import { Camera } from 'lucide-react'

export default function ARLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center animate-pulse">
          <Camera className="text-[#c9a84c]" size={28} />
        </div>
        <p className="text-gray-400 text-sm">準備 AR 模組中...</p>
      </div>
    </div>
  )
}
