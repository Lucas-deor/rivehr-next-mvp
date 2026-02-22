import { Skeleton } from '@/components/ui/skeleton'

export default function PipelineLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="px-6 py-4 border-b shrink-0">
        <Skeleton className="h-4 w-20 mb-3" />
        <Skeleton className="h-7 w-64 mb-1.5" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Kanban columns skeleton */}
      <div className="flex gap-4 p-6 overflow-x-auto flex-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="shrink-0 w-64 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            <div className="flex flex-col gap-2">
              {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, j) => (
                <div key={j} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-4 w-14 rounded-full" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
