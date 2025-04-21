"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, Award, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

// Define proper types
interface ProblemSubmission {
  id: string;
  problemId: string;
  studentId: string;
  score: number;
  status: string;
  isCorrect?: boolean;
  problem: {
    title: string;
    questionType: string;
    score: number;
  };
}

interface AssessmentSubmission {
  id: string;
  assessmentId: string;
  studentId: string;
  totalScore: number;
  maxScore: number;
  status: string;
  duration?: number;
  problemsCompleted: number;
  totalProblems: number;
  updatedAt: string | Date;
  assessment: {
    title: string;
    problems: {
      id: string;
      title: string;
      questionType: string;
      score: number;
    }[];
  };
  problemSubmissions: ProblemSubmission[];
}

interface SubmissionsClientProps {
  submissions: AssessmentSubmission[];
}

export default function SubmissionsClient({
  submissions,
}: SubmissionsClientProps) {
  const [selectedTab, setSelectedTab] = useState("all");

  // Filter submissions based on selected tab
  const filteredSubmissions =
    selectedTab === "all"
      ? submissions
      : submissions.filter((sub) =>
          selectedTab === "completed"
            ? sub.status === "COMPLETED" || sub.status === "SUBMITTED"
            : sub.status === selectedTab
        );

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "SUBMITTED":
        return "bg-green-600/20 text-green-400 border-green-600/30";
      case "TIMED_OUT":
        return "bg-red-600/20 text-red-400 border-red-600/30";
      case "IN_PROGRESS":
        return "bg-blue-600/20 text-blue-400 border-blue-600/30";
      default:
        return "bg-gray-600/20 text-gray-400 border-gray-600/30";
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "SUBMITTED":
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case "TIMED_OUT":
        return <XCircle className="h-4 w-4 mr-1" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-gray-800/80 rounded-full flex items-center justify-center mb-6">
          <Clock className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-200 mb-2">
          No submissions yet
        </h2>
        <p className="text-gray-400 max-w-md">
          You haven&apos;t submitted any assessments yet. When you complete
          assessments, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue="all"
        className="w-full"
        onValueChange={setSelectedTab}
      >
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-gray-800/50 border border-gray-700/50">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-gray-700"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="COMPLETED"
              className="data-[state=active]:bg-green-900/60"
            >
              Completed
            </TabsTrigger>
            <TabsTrigger
              value="IN_PROGRESS"
              className="data-[state=active]:bg-blue-900/60"
            >
              In Progress
            </TabsTrigger>
            <TabsTrigger
              value="TIMED_OUT"
              className="data-[state=active]:bg-red-900/60"
            >
              Timed Out
            </TabsTrigger>
          </TabsList>

          <div className="text-sm text-gray-400">
            {filteredSubmissions.length}{" "}
            {filteredSubmissions.length === 1 ? "submission" : "submissions"}
          </div>
        </div>

        <TabsContent value={selectedTab} className="mt-0">
          <div className="grid grid-cols-1 gap-6">
            {filteredSubmissions.map((submission) => (
              <Card
                key={submission.id}
                className="bg-gray-800/30 border border-gray-700/50 overflow-hidden"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-white">
                        {submission.assessment.title}
                      </CardTitle>
                      <CardDescription className="text-gray-400 mt-1 flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        Submitted{" "}
                        {formatDistanceToNow(new Date(submission.updatedAt), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${getStatusColor(
                        submission.status
                      )} flex items-center`}
                    >
                      {getStatusIcon(submission.status)}
                      {submission.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-900/50 border border-gray-800/60 rounded-lg p-4 flex flex-col">
                      <span className="text-gray-400 text-sm flex items-center mb-1">
                        <Award className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                        Score
                      </span>
                      <div className="mt-auto">
                        <div className="text-2xl font-bold text-white">
                          {submission.totalScore}/{submission.maxScore}
                        </div>
                        <div className="flex justify-between items-center mt-1 mb-1">
                          <span className="text-sm text-gray-400">
                            {Math.round(
                              (submission.totalScore / submission.maxScore) *
                                100
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            (submission.totalScore / submission.maxScore) * 100
                          }
                          className={`h-1.5 mt-2 ${
                            (submission.totalScore / submission.maxScore) *
                              100 >=
                            70
                              ? "[&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-500"
                              : (submission.totalScore / submission.maxScore) *
                                  100 >=
                                40
                              ? "[&>div]:bg-gradient-to-r [&>div]:from-yellow-500 [&>div]:to-amber-500"
                              : "[&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-rose-500"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="bg-gray-900/50 border border-gray-800/60 rounded-lg p-4 flex flex-col">
                      <span className="text-gray-400 text-sm flex items-center mb-1">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        Time Taken
                      </span>
                      <div className="mt-auto">
                        <div className="text-2xl font-bold text-white">
                          {submission.duration ? (
                            <>
                              {Math.floor(submission.duration / 60)}h{" "}
                              {submission.duration % 60}m
                            </>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-t border-gray-700/50 pt-4">
                  <Link
                    href={`/assessment/completed/${submission.assessmentId}`}
                    className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
                  >
                    View Detailed Results →
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
