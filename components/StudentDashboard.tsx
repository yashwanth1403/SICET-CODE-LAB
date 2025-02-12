"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock,
  BookOpen,
  CheckCircle,
  Calendar,
  Target,
  Layers,
} from "lucide-react";

import { AssessmentStatus } from "@prisma/client";
interface User {
  name: string;
  collegeId: string;
  batch: string;
  department: string;
}

export interface Assessment {
  id: string;
  title: string;
  batch: string[];
  departments: string[];
  startTime: string;
  endTime: string;
  duration: number;
  totalQuestions: number;
  topics: string[];
  status: AssessmentStatus;
}

interface StudentDashboardProps {
  user: User;
  upcomingAssessments: Assessment[];
}

const StudentDashboard = ({
  user,
  upcomingAssessments,
}: StudentDashboardProps) => {
  console.log("Upcoming Assessments:", upcomingAssessments);
  const metrics = {
    totalAssessments: 12,
    timeSpent: "45h 30m",
    problemsSolved: 234,
  };
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
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

  return (
    <div>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-900 min-h-screen text-gray-100 pt-16 md:pt-6">
        {/* Header with Logo */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 md:space-x-4 w-full sm:w-auto">
            <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gray-800 rounded-lg border border-gray-700">
              <img
                src="/srindu clg logo.png"
                alt="College Logo"
                className="w-8 h-8 md:w-12 md:h-12 object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Sri indu College of engineering and technology
              </h2>
              <p className="text-xs md:text-sm text-gray-400">Student Portal</p>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="space-y-1 md:space-y-2">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-300 flex flex-col sm:flex-row sm:items-center sm:space-x-2">
            <span>Welcome back,</span>
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              {user?.name || "Student"}
            </span>
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-2">
            <p className="text-sm md:text-base text-gray-400">
              Student ID:{" "}
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {user?.collegeId || "N/A"}
              </span>
            </p>
            <p className="text-sm md:text-base text-gray-400">
              Batch:{" "}
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {user?.batch || "N/A"}
              </span>
            </p>
            <p className="text-sm md:text-base text-gray-400">
              Branch:{" "}
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {user?.department || "N/A"}
              </span>
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center space-x-3 md:space-x-4">
                <BookOpen className="h-6 w-6 md:h-8 md:w-8 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent" />
                <div>
                  <p className="text-sm md:text-md font-medium text-gray-400">
                    Total Assessments
                  </p>
                  <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    {metrics.totalAssessments}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center space-x-3 md:space-x-4">
                <Clock className="h-6 w-6 md:h-8 md:w-8 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent" />
                <div>
                  <p className="text-sm md:text-md font-medium text-gray-400">
                    Time Spent
                  </p>
                  <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    {metrics.timeSpent}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 sm:col-span-2 md:col-span-1">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center space-x-3 md:space-x-4">
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent" />
                <div>
                  <p className="text-sm md:text-md font-medium text-gray-400">
                    Problems Solved
                  </p>
                  <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    {metrics.problemsSolved}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Assessments Section */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Upcoming Assessments
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="rounded-xl border border-gray-800 bg-gray-800/50 p-4 hover:bg-gray-800/70 transition-all"
                >
                  <div className="flex flex-col space-y-4">
                    {/* Header with Title and Departments */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">
                          {assessment.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {assessment.departments.map((dept) => (
                            <span
                              key={dept}
                              className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            >
                              {dept}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300 self-start">
                        {assessment.status}
                      </span>
                    </div>

                    {/* Time Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Window Opens */}
                      <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                        <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Window Opens</p>
                          <p className="text-sm font-medium text-white">
                            {formatDate(assessment.startTime)}
                            <span className="text-gray-400"> at </span>
                            {formatTime(assessment.startTime)}
                          </p>
                        </div>
                      </div>

                      {/* Window Closes */}
                      <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                        <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Window Closes</p>
                          <p className="text-sm font-medium text-white">
                            {formatDate(assessment.endTime)}
                            <span className="text-gray-400"> at </span>
                            {formatTime(assessment.endTime)}
                          </p>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <Target className="h-4 w-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Time Allowed</p>
                          <p className="text-sm font-medium text-white">
                            {assessment.duration} minutes
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Topics */}
                    <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                      <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <Layers className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">Topics Covered</p>
                        <p className="text-sm font-medium text-white">
                          {assessment.topics.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
