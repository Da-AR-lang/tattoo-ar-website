export default function GalleryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Filter bar skeleton */}
      <div className="flex flex-wrap gap-2 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-[#1a1a1a] animate-pulse" />
        ))}
      </div>
      {/* Grid skeleton */}
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="break-inside-avoid rounded-xl bg-[#1a1a1a] animate-pulse"
            style={{ aspectRatio: i % 3 === 0 ? '3/4' : i % 3 === 1 ? '1/1' : '4/3' }}
          />
        ))}
      </div>
    </div>
  )
}
