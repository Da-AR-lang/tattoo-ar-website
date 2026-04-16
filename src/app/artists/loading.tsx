export default function ArtistsLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="h-9 w-32 bg-[#1a1a1a] rounded-lg animate-pulse mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-[#2a2a2a]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#2a2a2a] rounded w-3/4" />
                <div className="h-3 bg-[#2a2a2a] rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-[#2a2a2a] rounded" />
              <div className="h-3 bg-[#2a2a2a] rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
