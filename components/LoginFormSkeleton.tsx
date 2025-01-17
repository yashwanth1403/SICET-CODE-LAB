import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Code2 } from "lucide-react";

const CollegeLoginFormSkeleton = () => {
  return (
    <Card className="w-full max-w-md bg-gray-900 border border-gray-800 shadow-2xl animate-pulse">
      <CardHeader className="space-y-1 border-b border-gray-800">
        <div className="flex items-center justify-between px-2">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <div className="h-6 w-20 bg-gray-700 rounded" />
        </div>
        <div className="p-4 bg-gray-900">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              <Code2 className="h-8 w-8 text-green-500/50" />
              <div className="h-8 w-32 bg-gray-700 rounded" />
            </div>
            <div className="text-center space-y-2">
              <div className="h-6 w-64 bg-gray-700 rounded mx-auto" />
              <div className="h-4 w-48 bg-gray-700 rounded mx-auto" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 my-4">
          {/* Student ID Field Skeleton */}
          <div className="space-y-2">
            <div className="h-6 w-24 bg-gray-700 rounded" />
            <div className="h-10 w-full bg-gray-700 rounded" />
          </div>

          {/* Password Field Skeleton */}
          <div className="space-y-2">
            <div className="h-6 w-32 bg-gray-700 rounded" />
            <div className="h-10 w-full bg-gray-700 rounded" />
          </div>

          {/* Button Skeleton */}
          <div className="h-10 w-full bg-blue-500/50 rounded" />

          {/* Register Link Skeleton */}
          <div className="pt-2">
            <div className="h-4 w-48 bg-gray-700 rounded mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CollegeLoginFormSkeleton;
