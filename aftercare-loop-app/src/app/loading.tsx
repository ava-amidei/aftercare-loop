import { LoadingRegion, Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading page" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-3xl bg-gray-0 p-5">
            <Skeleton className="mb-4 h-6 w-40" />
            <SkeletonText lines={3} />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
