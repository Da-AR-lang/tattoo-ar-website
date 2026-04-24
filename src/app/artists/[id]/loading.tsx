export default function ArtistDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="h-5 w-32 bg-[#1a1a1a] rounded animate-pulse mb-10" />

      <div className="flex flex-col sm:flex-row gap-8 mb-16 items-start animate-pulse">
        <div className="w-36 h-36 rounded-full bg-[#1a1a1a] flex-shrink-0 border-2 border-[#2a2a2a]" />
        <div className="flex-1 space-y-3">
          <div className="h-10 bg-[#2a2a2a] rounded w-1/3" />
          <div className="h-4 bg-[#2a2a2a] rounded w-full max-w-2xl" />
          <div className="h-4 bg-[#2a2a2a] rounded w-2/3 max-w-2xl" />
          <div className="h-4 bg-[#2a2a2a] rounded w-24" />
        </div>
      </div>

      <div className="h-7 w-24 bg-[#1a1a1a] rounded animate-pulse mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] bg-[#1a1a1a] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
