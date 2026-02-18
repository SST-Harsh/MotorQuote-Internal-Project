import { SkeletonCard, SkeletonTable } from '@/components/common/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen p-6 space-y-6 bg-[rgb(var(--color-background))]">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard
            key={i}
            className="bg-[rgb(var(--color-surface))] !border-[rgb(var(--color-border))]"
          />
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonTable
            rows={8}
            className="bg-[rgb(var(--color-surface))] !border-[rgb(var(--color-border))]"
          />
        </div>
        <div>
          <SkeletonCard className="bg-[rgb(var(--color-surface))] !border-[rgb(var(--color-border))]" />
          <div className="mt-6">
            <SkeletonCard className="bg-[rgb(var(--color-surface))] !border-[rgb(var(--color-border))]" />
          </div>
        </div>
      </div>
    </div>
  );
}
