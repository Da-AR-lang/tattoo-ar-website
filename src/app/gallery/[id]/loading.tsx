export default function TattooDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="h-5 w-28 bg-[#1a1a1a] rounded animate-pulse mb-6" />
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl overflow-hidden animate-pulse">
        <div className="aspect-[4/3] bg-[#1a1a1a]" />
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-[#2a2a2a] rounded w-2/3" />
              <div className="h-4 bg-[#2a2a2a] rounded w-1/3" />
            </div>
            <div className="h-8 w-8 bg-[#2a2a2a] rounded-full" />
          </div>
          <div className="h-px bg-[#2a2a2a]" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2a2a2a]" />
            <div className="space-y-1">
              <div className="h-3 w-24 bg-[#2a2a2a] rounded" />
              <div className="h-3 w-16 bg-[#2a2a2a] rounded" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <div className="h-10 flex-1 bg-[#2a2a2a] rounded-xl" />
            <div className="h-10 flex-1 bg-[#2a2a2a] rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
