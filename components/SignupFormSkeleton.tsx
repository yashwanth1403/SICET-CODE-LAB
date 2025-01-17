import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Code2 } from "lucide-react";

const SignupFormSkeleton = () => {
  return (
    <Card className="w-full max-w-sm bg-slate-800 border-slate-700 shadow-xl animate-pulse">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between px-2">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Code2 className="h-8 w-8 text-blue-500/50" />
            <div className="h-8 w-32 bg-slate-700 rounded" />
          </div>
        </div>
        <div className="h-4 w-64 bg-slate-700 rounded mx-auto mt-2" />
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {/* Batch Field Skeleton */}
          <div className="space-y-2">
            <div className="h-5 w-20 bg-slate-700 rounded" />
            <div className="h-10 w-full bg-slate-700 rounded" />
          </div>

          {/* Year of College Skeleton */}
          <div className="space-y-2">
            <div className="h-5 w-28 bg-slate-700 rounded" />
            <div className="h-10 w-full bg-slate-700 rounded" />
          </div>

          {/* Department Skeleton */}
          <div className="space-y-2">
            <div className="h-5 w-24 bg-slate-700 rounded" />
            <div className="h-10 w-full bg-slate-700 rounded" />
          </div>

          {/* Student ID Skeleton */}
          <div className="space-y-2">
            <div className="h-5 w-24 bg-slate-700 rounded" />
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="h-10 w-full bg-slate-700 rounded" />
              </div>
              <div className="w-24">
                <div className="h-10 w-full bg-slate-700 rounded" />
              </div>
            </div>
          </div>

          {/* Phone Number Skeleton */}
          <div className="space-y-2">
            <div className="h-5 w-28 bg-slate-700 rounded" />
            <div className="flex items-center">
              <div className="h-5 w-8 bg-slate-700 rounded" />
              <div className="h-10 flex-1 bg-slate-700 rounded ml-2" />
            </div>
          </div>

          {/* Password Skeleton */}
          <div className="space-y-2">
            <div className="h-5 w-20 bg-slate-700 rounded" />
            <div className="h-10 w-full bg-slate-700 rounded" />
          </div>

          {/* Button Skeleton */}
          <div className="h-10 w-full bg-blue-500/50 rounded mt-4" />

          {/* Login Link Skeleton */}
          <div className="flex justify-center pt-2">
            <div className="h-4 w-48 bg-slate-700 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignupFormSkeleton;
