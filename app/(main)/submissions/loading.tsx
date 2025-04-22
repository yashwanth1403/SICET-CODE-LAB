import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="container mx-auto py-8 px-4">
      <Skeleton className="h-10 w-48 mb-8 bg-gray-700" />

      <div className="space-y-4">
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <div key={index} className="rounded-lg bg-[#141E33] p-4">
              <div className="flex flex-col">
                <div className="flex justify-between mb-4">
                  <Skeleton className="h-6 w-[200px] bg-gray-700" />
                  <Skeleton className="h-6 w-[100px] bg-gray-700" />
                </div>
                <div className="flex gap-4 mb-2">
                  <Skeleton className="h-4 w-[120px] bg-gray-700" />
                  <Skeleton className="h-4 w-[80px] bg-gray-700" />
                </div>
                <Skeleton className="h-4 w-[150px] bg-gray-700 mb-4" />

                <div className="space-y-3 mt-4">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <Skeleton className="h-5 w-[250px] bg-gray-700" />
                        <Skeleton className="h-5 w-[80px] bg-gray-700" />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
      </div>
    </main>
  );
}
