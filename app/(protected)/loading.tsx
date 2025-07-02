export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Page header skeleton */}
      <div className="skeleton h-8 w-48 rounded"></div>
      
      {/* Content cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
            <div className="skeleton h-4 w-24 mb-2 rounded"></div>
            <div className="skeleton h-8 w-32 mb-1 rounded"></div>
            <div className="skeleton h-3 w-20 rounded"></div>
          </div>
        ))}
      </div>
      
      {/* Table skeleton */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="skeleton h-6 w-40 mb-4 rounded"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="skeleton h-4 w-32 rounded"></div>
              <div className="skeleton h-4 flex-1 rounded"></div>
              <div className="skeleton h-4 w-24 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}