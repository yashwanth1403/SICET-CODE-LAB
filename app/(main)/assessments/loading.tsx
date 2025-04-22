import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl p-8 mb-10 backdrop-blur-sm border border-gray-800">
          <Skeleton className="h-8 w-[250px] bg-gray-700 mb-3" />
          <Skeleton className="h-5 w-[350px] bg-gray-700 ml-9" />
        </div>

        <div className="space-y-6">
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                className="bg-gray-800/80 rounded-xl overflow-hidden border border-gray-700 transition-all shadow-lg backdrop-blur-sm"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-6 w-[200px] bg-gray-700" />
                    <Skeleton className="h-6 w-[100px] bg-gray-700 rounded-full" />
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mb-4">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-500 h-1.5 rounded-full"
                      style={{ width: `60%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {Array(4)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="bg-gray-700/30 rounded-lg p-2.5 backdrop-blur-sm"
                        >
                          <div className="flex items-center">
                            <Skeleton className="h-4 w-4 rounded-full bg-blue-400 mr-2" />
                            <div>
                              <Skeleton className="h-3 w-[60px] bg-gray-600 mb-1" />
                              <Skeleton className="h-4 w-[80px] bg-gray-500" />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton
                          key={i}
                          className="h-6 w-[80px] bg-gray-700 rounded-full"
                        />
                      ))}
                  </div>

                  <div className="flex justify-end mt-4">
                    <Skeleton className="h-10 w-[120px] bg-blue-600/30 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
