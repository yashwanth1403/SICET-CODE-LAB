"use client";

import React from "react";

export default function McqLoading() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-100">
      <div className="max-w-5xl mx-auto p-6">
        <div className="animate-pulse space-y-8">
          {/* Header skeleton */}
          <div className="h-8 w-64 bg-gray-800 rounded-md"></div>

          {/* Card skeleton */}
          <div className="bg-[#0d1424] rounded-lg border border-gray-800/50 p-5">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Question navigation sidebar */}
              <div className="lg:w-1/4">
                <div className="bg-[#0d1424] rounded-lg border border-gray-800/50 p-4">
                  <div className="h-6 w-24 bg-gray-800 rounded mb-3"></div>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-10 w-10 rounded-md bg-[#1a2234] animate-pulse"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Current question card */}
              <div className="lg:w-3/4 flex flex-col">
                <div className="bg-[#0d1424] rounded-lg border border-gray-800/50 p-6 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-6 w-48 bg-gray-800 rounded"></div>
                    <div className="h-6 w-16 bg-blue-900/50 rounded-full"></div>
                  </div>

                  <div className="my-6">
                    <div className="h-24 bg-gray-800 rounded mb-6"></div>

                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={index}
                          className="flex items-center p-3 rounded-lg border border-gray-800/50 h-12"
                        >
                          <div className="w-5 h-5 rounded-full border border-gray-600 mr-3"></div>
                          <div className="h-4 bg-gray-800 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="bg-[#0d1424] rounded-lg border border-gray-800/50 p-4 flex justify-between items-center">
                  <div className="flex space-x-2">
                    <div className="h-10 w-24 bg-gray-800 rounded"></div>
                    <div className="h-10 w-24 bg-gray-800 rounded"></div>
                  </div>
                  <div className="h-10 w-32 bg-blue-900/50 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
