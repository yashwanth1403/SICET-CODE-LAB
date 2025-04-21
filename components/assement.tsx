"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Code,
  Timer,
  Calendar,
  GraduationCap,
  AlertCircle,
  Tag,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import { redirect } from "next/navigation";

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
  });
};

const formatTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const Assessment = ({ OngoingAssessments }) => {
  async function handleStartAssement(assessmentId) {
    redirect(`assessment/ongoing/${assessmentId}`);
  }
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header with Notice */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
          <div className="flex gap-2 text-sm text-blue-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              {
                "Assessments are only accessible between opening and closing times. Once started, you'll have the specified duration to complete."
              }
            </p>
          </div>
        </div>

        {/* Title Bar */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-500" />
            Available Assessments
          </h1>
        </div>

        {/* Empty State or Assessment Cards */}
        {OngoingAssessments.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <ClipboardList className="h-16 w-16 text-gray-600" />
                  <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1">
                    <RefreshCw className="h-5 w-5 text-blue-500 animate-spin-slow" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">
                    No Active Assessments
                  </h3>
                  <p className="text-gray-400 text-sm max-w-md">
                    There are currently no assessments available. New
                    assessments will appear here when they become available.
                    Check back later!
                  </p>
                </div>
                <Button
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {OngoingAssessments.map((assessment) => (
              <Card key={assessment.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Left: Title and Tags */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-base font-medium text-white truncate">
                          {assessment.title}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300 whitespace-nowrap">
                          {assessment.status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Code className="h-3.5 w-3.5" />
                          Departments
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {assessment.departments.map((dept) => (
                            <span
                              key={dept}
                              className="px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-400"
                            >
                              {dept}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Tag className="h-3.5 w-3.5" />
                          Topics
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {assessment.topics.map((topic) => (
                            <span
                              key={topic}
                              className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Time and Action */}
                    <div className="lg:w-64 flex flex-col gap-3 bg-gray-750/50 rounded-lg p-3">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-green-500" />
                          <div>
                            <div className="text-xs text-gray-400 mb-0.5">
                              Opens
                            </div>
                            <div className="text-sm text-gray-300">
                              {formatDate(assessment.startTime)} •{" "}
                              {formatTime(assessment.startTime)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-red-500" />
                          <div>
                            <div className="text-xs text-gray-400 mb-0.5">
                              Closes
                            </div>
                            <div className="text-sm text-gray-300">
                              {formatDate(assessment.endTime)} •{" "}
                              {formatTime(assessment.endTime)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-purple-500" />
                          <div>
                            <div className="text-xs text-gray-400 mb-0.5">
                              Duration
                            </div>
                            <div className="text-sm text-gray-300">
                              {assessment.duration} minutes
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white h-9 text-sm"
                        onClick={() => handleStartAssement(assessment.id)}
                      >
                        Start Assessment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Assessment;
