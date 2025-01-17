"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, BookOpen, CheckCircle, Calendar } from "lucide-react";
import { useSession } from "next-auth/react";
import { Spotlight } from "./ui/spotlight";

const StudentDashboard = () => {
  const { data: session, status } = useSession();

  const metrics = {
    totalAssessments: 12,
    timeSpent: "45h 30m",
    problemsSolved: 234,
  };

  const upcomingAssessments = [
    {
      id: 1,
      title: "Mid-term Mathematics",
      date: "Jan 20, 2025",
      duration: "2 hours",
    },
    {
      id: 2,
      title: "Physics Quiz",
      date: "Jan 22, 2025",
      duration: "1 hour",
    },
    {
      id: 3,
      title: "Chemistry Lab Assessment",
      date: "Jan 25, 2025",
      duration: "3 hours",
    },
  ];

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
              {session?.user?.name}
            </span>
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-2">
            <p className="text-sm md:text-base text-gray-400">
              Student ID:{" "}
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {session?.user?.collegeId}
              </span>
            </p>
            <p className="text-sm md:text-base text-gray-400">
              Batch:{" "}
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                2023-2027
              </span>
            </p>
            <p className="text-sm md:text-base text-gray-400">
              Branch:{" "}
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Computer Science
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
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg md:text-xl bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              <Calendar className="h-4 w-4 md:h-5 md:w-5" />
              <span>Upcoming Assessments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {upcomingAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border border-gray-700 rounded-lg bg-gray-850 hover:bg-gray-750 transition-colors space-y-2 sm:space-y-0"
                >
                  <div>
                    <h4 className="text-sm md:text-base font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                      {assessment.title}
                    </h4>
                    <p className="text-xs md:text-sm text-gray-400">
                      {assessment.date}
                    </p>
                  </div>
                  <span className="text-xs md:text-sm bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    {assessment.duration}
                  </span>
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
