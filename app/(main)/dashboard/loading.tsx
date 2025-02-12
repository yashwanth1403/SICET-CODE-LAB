import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0B1120] p-6 text-white">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-16 w-16 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-[400px] bg-gray-700" />
          <Skeleton className="h-4 w-[100px] bg-gray-700" />
        </div>
      </div>

      {/* Welcome Section */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[150px] bg-gray-700" />
          <Skeleton className="h-8 w-[200px] bg-gray-700" />
        </div>

        <div className="flex gap-8 text-gray-400">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-[100px] bg-gray-700" />
            <Skeleton className="h-5 w-[100px] bg-gray-700" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-[60px] bg-gray-700" />
            <Skeleton className="h-5 w-[100px] bg-gray-700" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-[70px] bg-gray-700" />
            <Skeleton className="h-5 w-[60px] bg-gray-700" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {["Total Assessments", "Time Spent", "Problems Solved"].map((stat) => (
          <div key={stat} className="p-6 rounded-lg bg-[#141E33]">
            <Skeleton className="h-5 w-[150px] mb-3 bg-gray-700" />
            <Skeleton className="h-8 w-[100px] bg-gray-700" />
          </div>
        ))}
      </div>

      {/* Upcoming Assessments */}
      <div className="rounded-lg bg-[#141E33] p-6">
        <Skeleton className="h-6 w-[200px] mb-6 bg-gray-700" />

        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="flex justify-between items-center p-4 rounded bg-[#0B1120]"
            >
              <div className="space-y-2">
                <Skeleton className="h-5 w-[150px] bg-gray-700" />
                <Skeleton className="h-4 w-[200px] bg-gray-700" />
              </div>
              <Skeleton className="h-6 w-[50px] bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
