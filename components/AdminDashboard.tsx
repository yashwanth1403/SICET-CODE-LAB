"use client";
import React, { useEffect, useState } from "react";
import {
  Plus,
  Book,
  Users,
  Trophy,
  Calendar,
  ChevronDown,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ProfessorDashboard = () => {
  const [activeTab, setActiveTab] = useState("assessments");
  const [client, setClient] = useState(false);

  const stats = [
    { title: "Total Assessments", value: "24", icon: Book },
    { title: "Active Students", value: "156", icon: Users },
    { title: "Avg. Score", value: "72%", icon: Trophy },
    { title: "This Month", value: "8", icon: Calendar },
  ];

  const recentAssessments = [
    {
      title: "Data Structures Mid-Term",
      date: "2025-01-15",
      submissions: 45,
      avgScore: 76,
    },
    {
      title: "Algorithms Quiz #3",
      date: "2025-01-12",
      submissions: 38,
      avgScore: 82,
    },
    {
      title: "Python Programming Basics",
      date: "2025-01-10",
      submissions: 52,
      avgScore: 68,
    },
  ];
  useEffect(() => {
    setClient(true);
  }, []);
  if (!client) {
    return <div>loading....</div>;
  }
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            Professor Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Manage your coding assessments and track student progress
          </p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:opacity-90">
          <Plus size={20} />
          Create Assessment
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <Icon className="text-blue-500" size={24} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-800 border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Recent Assessments
                </h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Search assessments..."
                      className="bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button className="flex items-center gap-2 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm">
                    Sort by <ChevronDown size={16} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-sm">
                      <th className="text-left pb-4">Title</th>
                      <th className="text-left pb-4">Date</th>
                      <th className="text-left pb-4">Submissions</th>
                      <th className="text-left pb-4">Avg. Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAssessments.map((assessment) => (
                      <tr
                        key={assessment.title}
                        className="border-t border-gray-700"
                      >
                        <td className="py-4 text-white">{assessment.title}</td>
                        <td className="py-4 text-gray-400">
                          {assessment.date}
                        </td>
                        <td className="py-4 text-gray-400">
                          {assessment.submissions}
                        </td>
                        <td className="py-4">
                          <span className="text-emerald-500">
                            {assessment.avgScore}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div>
          <Card className="bg-gray-800 border-gray-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                Quick Actions
              </h2>
              <div className="space-y-4">
                <button className="w-full bg-gray-700 text-white p-4 rounded-lg text-left hover:bg-gray-600">
                  Create New Assessment
                </button>
                <button className="w-full bg-gray-700 text-white p-4 rounded-lg text-left hover:bg-gray-600">
                  View Student Reports
                </button>
                <button className="w-full bg-gray-700 text-white p-4 rounded-lg text-left hover:bg-gray-600">
                  Manage Question Bank
                </button>
                <button className="w-full bg-gray-700 text-white p-4 rounded-lg text-left hover:bg-gray-600">
                  Review Submissions
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfessorDashboard;
