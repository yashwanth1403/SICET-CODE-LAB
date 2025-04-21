"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchProfessorAssessmentSubmissions } from "@/actions/AssessmentFetch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Award,
  Users,
  Calendar,
  BookOpen,
  BarChart2,
  Clipboard,
} from "lucide-react";

type AssessmentSubmission = {
  id: string;
  totalScore: number;
  maxScore: number;
  status: string;
  startTime: string;
  endTime: string;
  codingScore: number;
  mcqScore: number;
  student: {
    id: string;
    name: string;
    studentId: string;
    department: string;
    batch: string;
  };
  assessment: {
    id: string;
    title: string;
    totalQuestions: number;
    startTime: string;
    endTime: string;
  };
};

type AssessmentGroup = {
  assessment: {
    id: string;
    title: string;
    batch: string[];
    departments: string[];
    startTime: string;
    endTime: string;
    totalQuestions: number;
  };
  submissions: AssessmentSubmission[];
  topScorer: AssessmentSubmission | null;
  averageScore: number;
};

type SubmissionsClientProps = {
  initialData: AssessmentGroup[];
  professorId: string;
};

export default function SubmissionsClient({
  initialData,
  professorId,
}: SubmissionsClientProps) {
  const [selectedAssessment, setSelectedAssessment] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] =
    useState<string>("all_departments");
  const [batchFilter, setBatchFilter] = useState<string>("all_batches");
  const [studentIdFilter, setStudentIdFilter] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "score",
    direction: "desc",
  });
  const [submissionData, setSubmissionData] =
    useState<AssessmentGroup[]>(initialData);
  const [loading, setLoading] = useState(false);

  // Extract unique departments and batches from the data for filter dropdowns
  const departments = Array.from(
    new Set(
      initialData.flatMap((group) =>
        group.submissions.map((sub) => sub.student.department)
      )
    )
  )
    .filter(Boolean)
    .sort();

  const batches = Array.from(
    new Set(
      initialData.flatMap((group) =>
        group.submissions.map((sub) => sub.student.batch)
      )
    )
  )
    .filter(Boolean)
    .sort();

  // Get assessment options for the dropdown
  const assessmentOptions = initialData.map((group) => ({
    id: group.assessment.id,
    title: group.assessment.title,
  }));

  // Apply filters and fetch updated data
  const applyFilters = async () => {
    setLoading(true);
    try {
      const filters: Record<string, string | "asc" | "desc"> = {
        orderBy: sortConfig.key as "score" | "date",
        orderDirection: sortConfig.direction,
      };

      if (selectedAssessment !== "all") {
        filters.assessmentId = selectedAssessment;
      }

      if (departmentFilter && departmentFilter !== "all_departments") {
        filters.department = departmentFilter;
      }

      if (batchFilter && batchFilter !== "all_batches") {
        filters.batch = batchFilter;
      }

      if (studentIdFilter) {
        filters.studentId = studentIdFilter;
      }

      const filteredData = await fetchProfessorAssessmentSubmissions(
        professorId,
        filters
      );
      setSubmissionData(filteredData);
    } catch (error) {
      console.error("Error applying filters:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedAssessment("all");
    setDepartmentFilter("all_departments");
    setBatchFilter("all_batches");
    setStudentIdFilter("");
    setSortConfig({ key: "score", direction: "desc" });
    setSubmissionData(initialData);
  };

  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  // Prepare data for pie chart (score distribution)
  const getPieChartData = (submissions: AssessmentSubmission[]) => {
    const ranges = [
      { name: "0-25%", range: [0, 25], value: 0, color: "#ef4444" },
      { name: "26-50%", range: [26, 50], value: 0, color: "#f97316" },
      { name: "51-75%", range: [51, 75], value: 0, color: "#3b82f6" },
      { name: "76-100%", range: [76, 100], value: 0, color: "#22c55e" },
    ];

    submissions.forEach((sub) => {
      const percentage =
        sub.maxScore > 0 ? (sub.totalScore / sub.maxScore) * 100 : 0;

      for (const range of ranges) {
        if (percentage >= range.range[0] && percentage <= range.range[1]) {
          range.value++;
          break;
        }
      }
    });

    return ranges;
  };

  useEffect(() => {
    // Apply filters when sort configuration changes
    if (initialData.length > 0) {
      applyFilters();
    }
  }, [sortConfig]);

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <Card className="bg-slate-800 border-slate-700 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center">
            <Filter className="mr-2 h-5 w-5 text-blue-400" />
            Filter Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Assessment Filter */}
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Assessment
              </label>
              <Select
                value={selectedAssessment}
                onValueChange={setSelectedAssessment}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100">
                  <SelectValue placeholder="All Assessments" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-slate-200">
                    All Assessments
                  </SelectItem>
                  {assessmentOptions.map((assessment) => (
                    <SelectItem
                      key={assessment.id}
                      value={assessment.id}
                      className="text-slate-200"
                    >
                      {assessment.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Department
              </label>
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem
                    value="all_departments"
                    className="text-slate-200"
                  >
                    All Departments
                  </SelectItem>
                  {departments.map((dept) => (
                    <SelectItem
                      key={dept}
                      value={dept}
                      className="text-slate-200"
                    >
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Batch Filter */}
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Batch</label>
              <Select value={batchFilter} onValueChange={setBatchFilter}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100">
                  <SelectValue placeholder="All Batches" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all_batches" className="text-slate-200">
                    All Batches
                  </SelectItem>
                  {batches.map((batch) => (
                    <SelectItem
                      key={batch}
                      value={batch}
                      className="text-slate-200"
                    >
                      {batch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student ID Filter */}
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Student ID
              </label>
              <div className="flex items-center">
                <Input
                  type="text"
                  placeholder="Search by student ID"
                  value={studentIdFilter}
                  onChange={(e) => setStudentIdFilter(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-slate-100"
                />
                <Search className="w-4 h-4 text-slate-400 -ml-8" />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex space-x-2 items-end">
              <Button
                onClick={applyFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? "Filtering..." : "Apply Filters"}
              </Button>
              <Button
                onClick={resetFilters}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="assessments" className="w-full">
        <TabsList className="bg-slate-800 border-slate-700 mb-4">
          <TabsTrigger
            value="assessments"
            className="data-[state=active]:bg-blue-600"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Assessment Overview
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="data-[state=active]:bg-blue-600"
          >
            <Users className="h-4 w-4 mr-2" />
            Student Performance
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-blue-600"
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Assessments Tab Content */}
        <TabsContent value="assessments" className="space-y-6">
          {submissionData.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700 shadow-lg p-8">
              <div className="text-center text-slate-400">
                <Clipboard className="h-12 w-12 mx-auto mb-3 text-slate-500" />
                <h3 className="text-xl font-medium mb-2">No Assessment Data</h3>
                <p>
                  No assessments have been created or no submissions have been
                  made yet.
                </p>
              </div>
            </Card>
          ) : (
            submissionData.map((group) => (
              <Card
                key={group.assessment.id}
                className="bg-slate-800 border-slate-700 shadow-lg overflow-hidden"
              >
                <CardHeader className="bg-slate-800/80 border-b border-slate-700 pb-2">
                  <CardTitle className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1 font-mono">
                        <span className="text-cyan-400">&lt;</span>
                        {group.assessment.title}
                        <span className="text-cyan-400">/&gt;</span>
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span className="font-mono">
                          {new Date(
                            group.assessment.startTime
                          ).toLocaleDateString()}{" "}
                          <span className="text-cyan-500">to</span>{" "}
                          {new Date(
                            group.assessment.endTime
                          ).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-300">
                        <span className="font-medium text-blue-400 font-mono">
                          {group.submissions.length}
                        </span>{" "}
                        <span className="font-mono">submissions</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Avg:{" "}
                        <span className="text-cyan-400">
                          {group.averageScore.toFixed(1)}
                        </span>
                        <span className="text-slate-500">/</span>
                        <span>{group.submissions[0]?.maxScore || 0}</span>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                  {/* Top Scorer Card if available */}
                  {group.topScorer && (
                    <div className="p-4 bg-slate-700/50 border-b border-slate-700 flex items-center">
                      <Award className="h-10 w-10 text-yellow-500 mr-4" />
                      <div>
                        <h4 className="text-sm font-medium text-white">
                          Top Scorer
                        </h4>
                        <p className="text-xs text-slate-300">
                          {group.topScorer.student.name} (
                          {group.topScorer.student.studentId}) -
                          <span className="text-yellow-400 font-medium ml-1">
                            {group.topScorer.totalScore} /{" "}
                            {group.topScorer.maxScore} points
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submissions Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-800/60">
                        <TableRow>
                          <TableHead className="text-slate-400 w-[50px] font-mono">
                            #
                          </TableHead>
                          <TableHead className="text-cyan-400 font-mono">
                            Student
                          </TableHead>
                          <TableHead className="text-cyan-400 font-mono">
                            ID
                          </TableHead>
                          <TableHead className="text-cyan-400 font-mono">
                            Department
                          </TableHead>
                          <TableHead className="text-cyan-400 font-mono">
                            Batch
                          </TableHead>
                          <TableHead
                            className="text-cyan-400 cursor-pointer font-mono"
                            onClick={() => handleSort("score")}
                          >
                            <div className="flex items-center">
                              Score
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="text-cyan-400 font-mono">
                            MCQ / Coding
                          </TableHead>
                          <TableHead
                            className="text-cyan-400 cursor-pointer font-mono"
                            onClick={() => handleSort("date")}
                          >
                            <div className="flex items-center">
                              Submitted
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.submissions.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="text-center text-slate-400 py-8"
                            >
                              No submissions found for this assessment
                            </TableCell>
                          </TableRow>
                        ) : (
                          group.submissions.map((submission, index) => (
                            <TableRow
                              key={submission.id}
                              className="border-b border-slate-700 odd:bg-slate-800/30 even:bg-slate-800/10 hover:bg-slate-700/50"
                            >
                              <TableCell className="text-slate-500 font-mono">
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-medium text-white">
                                {submission.student.name || "N/A"}
                              </TableCell>
                              <TableCell className="text-slate-300 font-mono">
                                {submission.student.studentId}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                <span className="px-2 py-1 rounded bg-slate-700/50 text-xs font-medium">
                                  {submission.student.department}
                                </span>
                              </TableCell>
                              <TableCell className="text-slate-300">
                                <span className="text-xs font-mono px-2 py-1 rounded bg-blue-900/30 text-blue-300 border border-blue-800/30">
                                  {submission.student.batch}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <span className="text-blue-400 font-mono">
                                    {submission.totalScore}
                                  </span>
                                  <span className="mx-1 text-slate-500 font-mono">
                                    /
                                  </span>
                                  <span className="text-slate-300 font-mono">
                                    {submission.maxScore}
                                  </span>
                                  <span className="ml-2 text-xs text-cyan-500 font-mono">
                                    {Math.round(
                                      (submission.totalScore /
                                        submission.maxScore) *
                                        100
                                    )}
                                    %
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-300">
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center">
                                    <span className="text-xs text-cyan-500 font-mono">
                                      mcq:
                                    </span>
                                    <span className="ml-1 text-blue-400 font-mono">
                                      {submission.mcqScore || 0}
                                    </span>
                                  </div>
                                  <div className="text-slate-500 font-mono">
                                    /
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-xs text-cyan-500 font-mono">
                                      code:
                                    </span>
                                    <span className="ml-1 text-purple-400 font-mono">
                                      {submission.codingScore || 0}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-300 font-mono text-xs">
                                {new Date(
                                  submission.endTime || ""
                                ).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Students Tab Content */}
        <TabsContent value="students" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle>Student Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-slate-700/40">
                  <TableRow>
                    <TableHead className="text-slate-300">Student</TableHead>
                    <TableHead className="text-slate-300">ID</TableHead>
                    <TableHead className="text-slate-300">Department</TableHead>
                    <TableHead className="text-slate-300">Batch</TableHead>
                    <TableHead className="text-slate-300">
                      Assessments Taken
                    </TableHead>
                    <TableHead className="text-slate-300">Avg. Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Get unique students from all submissions */}
                  {Array.from(
                    new Set(
                      submissionData.flatMap((group) =>
                        group.submissions.map((sub) => sub.student.id)
                      )
                    )
                  ).map((studentId) => {
                    // Find all submissions for this student
                    const studentSubmissions = submissionData.flatMap((group) =>
                      group.submissions.filter(
                        (sub) => sub.student.id === studentId
                      )
                    );

                    if (studentSubmissions.length === 0) return null;

                    const student = studentSubmissions[0].student;
                    const avgScore =
                      studentSubmissions.reduce(
                        (sum, sub) =>
                          sum + (sub.totalScore / sub.maxScore) * 100,
                        0
                      ) / studentSubmissions.length;

                    return (
                      <TableRow
                        key={studentId}
                        className="border-b border-slate-700"
                      >
                        <TableCell className="font-medium text-slate-200">
                          {student.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {student.studentId}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {student.department}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {student.batch}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {studentSubmissions.length}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div
                              className={`h-2 rounded-full ${
                                avgScore >= 75
                                  ? "bg-emerald-500"
                                  : avgScore >= 50
                                  ? "bg-blue-500"
                                  : avgScore >= 25
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${avgScore}%`,
                                maxWidth: "100px",
                              }}
                            ></div>
                            <span className="ml-2 text-slate-200">
                              {avgScore.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab Content */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <Card className="bg-slate-800 border-slate-700 shadow-lg">
              <CardHeader className="border-b border-slate-700 pb-3">
                <CardTitle className="text-lg font-mono flex items-center">
                  <span className="text-cyan-400 mr-2">&lt;</span>
                  Score Distribution
                  <span className="text-cyan-400 ml-2">/&gt;</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {submissionData.flatMap((group) => group.submissions).length >
                0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPieChartData(
                            submissionData.flatMap((group) => group.submissions)
                          )}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          animationDuration={800}
                          animationBegin={200}
                        >
                          {getPieChartData(
                            submissionData.flatMap((group) => group.submissions)
                          ).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              strokeWidth={2}
                              stroke="#1e293b"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            borderColor: "#475569",
                            color: "#e2e8f0",
                            borderRadius: "0.375rem",
                            fontFamily: "monospace",
                          }}
                          itemStyle={{ color: "#e2e8f0" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-400 font-mono">
                    <div className="text-center">
                      <div className="text-cyan-500 text-4xl mb-4">{"{ }"}</div>
                      <p>No data available for visualization</p>
                    </div>
                  </div>
                )}

                {/* Legend */}
                {submissionData.flatMap((group) => group.submissions).length >
                  0 && (
                  <div className="grid grid-cols-2 gap-2 mt-6 text-xs font-mono">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <span className="text-slate-300">
                        0-25%: <span className="text-red-400">Struggling</span>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                      <span className="text-slate-300">
                        26-50%:{" "}
                        <span className="text-orange-400">Developing</span>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-slate-300">
                        51-75%:{" "}
                        <span className="text-blue-400">Proficient</span>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-slate-300">
                        76-100%:{" "}
                        <span className="text-green-400">Advanced</span>
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assessment Performance */}
            <Card className="bg-slate-800 border-slate-700 shadow-lg">
              <CardHeader className="border-b border-slate-700 pb-3">
                <CardTitle className="text-lg font-mono flex items-center">
                  <span className="text-cyan-400 mr-2">&lt;</span>
                  Assessment Performance
                  <span className="text-cyan-400 ml-2">/&gt;</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {submissionData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={submissionData.map((group) => ({
                          name:
                            group.assessment.title.length > 12
                              ? group.assessment.title.substring(0, 12) + "..."
                              : group.assessment.title,
                          avgScore: Number(group.averageScore.toFixed(1)),
                          submissions: group.submissions.length,
                          maxScore: group.submissions[0]?.maxScore || 0,
                          completionRate:
                            (group.submissions.filter(
                              (sub) =>
                                sub.status === "COMPLETED" ||
                                sub.status === "SUBMITTED"
                            ).length /
                              group.submissions.length) *
                            100,
                        }))}
                        margin={{ top: 10, right: 30, left: 0, bottom: 70 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#334155"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#9ca3af", fontFamily: "monospace" }}
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis
                          tick={{ fill: "#9ca3af", fontFamily: "monospace" }}
                          domain={[0, "dataMax"]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            borderColor: "#475569",
                            color: "#e2e8f0",
                            borderRadius: "0.375rem",
                            fontFamily: "monospace",
                          }}
                          itemStyle={{ color: "#e2e8f0" }}
                          formatter={(value, name) => {
                            if (name === "Avg. Score") return [value, "Score"];
                            if (name === "Completion")
                              return [
                                `${value.toFixed(0)}%`,
                                "Completion Rate",
                              ];
                            return [value, name];
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          wrapperStyle={{ fontFamily: "monospace" }}
                        />
                        <Bar
                          dataKey="avgScore"
                          name="Avg. Score"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="completionRate"
                          name="Completion"
                          fill="#22c55e"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-400 font-mono">
                    <div className="text-center">
                      <div className="text-cyan-500 text-4xl mb-4">{"[ ]"}</div>
                      <p>No data available for visualization</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Key Metrics */}
            <Card className="bg-slate-800 border-slate-700 shadow-lg col-span-1">
              <CardHeader className="border-b border-slate-700 pb-3">
                <CardTitle className="text-lg font-mono flex items-center">
                  <span className="text-cyan-400 mr-2">&lt;</span>
                  Key Metrics
                  <span className="text-cyan-400 ml-2">/&gt;</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {submissionData.flatMap((group) => group.submissions).length >
                0 ? (
                  <div className="space-y-4">
                    {/* Calculate overall metrics */}
                    {(() => {
                      const allSubmissions = submissionData.flatMap(
                        (group) => group.submissions
                      );

                      // Total submissions
                      const totalSubmissions = allSubmissions.length;

                      // Overall average score
                      const overallAvg =
                        allSubmissions.reduce(
                          (sum, sub) => sum + sub.totalScore / sub.maxScore,
                          0
                        ) / Math.max(1, totalSubmissions);

                      // Coding vs MCQ distribution
                      const codingTotal = allSubmissions.reduce(
                        (sum, sub) => sum + (sub.codingScore || 0),
                        0
                      );

                      const mcqTotal = allSubmissions.reduce(
                        (sum, sub) => sum + (sub.mcqScore || 0),
                        0
                      );

                      const totalScore = codingTotal + mcqTotal;

                      // Completion rate
                      const completedSubmissions = allSubmissions.filter(
                        (sub) =>
                          sub.status === "COMPLETED" ||
                          sub.status === "SUBMITTED"
                      ).length;

                      const completionRate =
                        (completedSubmissions / Math.max(1, totalSubmissions)) *
                        100;

                      // Unique students
                      const uniqueStudents = new Set(
                        allSubmissions.map((sub) => sub.student.id)
                      ).size;

                      // Department with best performance
                      const deptPerformance = {};
                      allSubmissions.forEach((sub) => {
                        const dept = sub.student.department;
                        if (!deptPerformance[dept]) {
                          deptPerformance[dept] = {
                            total: 0,
                            count: 0,
                          };
                        }
                        deptPerformance[dept].total +=
                          sub.totalScore / sub.maxScore;
                        deptPerformance[dept].count += 1;
                      });

                      let bestDept = { name: "N/A", avg: 0 };

                      Object.entries(deptPerformance).forEach(
                        ([dept, data]) => {
                          const avgScore = data.total / data.count;
                          if (avgScore > bestDept.avg) {
                            bestDept = { name: dept, avg: avgScore };
                          }
                        }
                      );

                      return (
                        <>
                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                            <div className="text-xs text-slate-400 mb-1 font-mono">
                              Overall Average
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-bold text-white font-mono">
                                {(overallAvg * 100).toFixed(1)}%
                              </div>
                              <div className="text-xs py-1 px-2 rounded bg-blue-900/30 text-blue-300 border border-blue-800/30 font-mono">
                                {totalSubmissions} submissions
                              </div>
                            </div>
                            <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                style={{ width: `${overallAvg * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                            <div className="text-xs text-slate-400 mb-1 font-mono">
                              Question Types Distribution
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="text-xs mb-1 font-mono flex justify-between">
                                  <span className="text-cyan-400">Coding</span>
                                  <span className="text-white">
                                    {totalScore > 0
                                      ? Math.round(
                                          (codingTotal / totalScore) * 100
                                        )
                                      : 0}
                                    %
                                  </span>
                                </div>
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-purple-500 rounded-full"
                                    style={{
                                      width: `${
                                        totalScore > 0
                                          ? (codingTotal / totalScore) * 100
                                          : 0
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="text-xs mb-1 font-mono flex justify-between">
                                  <span className="text-cyan-400">MCQ</span>
                                  <span className="text-white">
                                    {totalScore > 0
                                      ? Math.round(
                                          (mcqTotal / totalScore) * 100
                                        )
                                      : 0}
                                    %
                                  </span>
                                </div>
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{
                                      width: `${
                                        totalScore > 0
                                          ? (mcqTotal / totalScore) * 100
                                          : 0
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                              <div className="text-xs text-slate-400 mb-1 font-mono">
                                Completion Rate
                              </div>
                              <div className="text-xl font-bold text-cyan-400 font-mono">
                                {completionRate.toFixed(1)}%
                              </div>
                              <div className="text-xs text-slate-400 font-mono">
                                {completedSubmissions}/{totalSubmissions}{" "}
                                submissions
                              </div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                              <div className="text-xs text-slate-400 mb-1 font-mono">
                                Total Students
                              </div>
                              <div className="text-xl font-bold text-cyan-400 font-mono">
                                {uniqueStudents}
                              </div>
                              <div className="text-xs text-slate-400 font-mono">
                                Across {submissionData.length} assessments
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                            <div className="text-xs text-slate-400 mb-1 font-mono">
                              Best Performing Department
                            </div>
                            <div className="text-lg font-bold text-white font-mono">
                              {bestDept.name}
                            </div>
                            <div className="text-xs text-slate-400 font-mono flex items-center">
                              <span className="text-yellow-400 mr-1">★</span>
                              Average: {(bestDept.avg * 100).toFixed(1)}%
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-400 font-mono">
                    <div className="text-center">
                      <div className="text-cyan-500 text-4xl mb-4">404</div>
                      <p>No data available for metrics</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Time-based Analysis */}
            <Card className="bg-slate-800 border-slate-700 shadow-lg col-span-2">
              <CardHeader className="border-b border-slate-700 pb-3">
                <CardTitle className="text-lg font-mono flex items-center">
                  <span className="text-cyan-400 mr-2">&lt;</span>
                  Student Performance by Department
                  <span className="text-cyan-400 ml-2">/&gt;</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {submissionData.flatMap((group) => group.submissions).length >
                0 ? (
                  <div className="h-80">
                    {(() => {
                      // Organize data by department
                      const deptData = {};

                      submissionData
                        .flatMap((group) => group.submissions)
                        .forEach((sub) => {
                          const dept = sub.student.department;
                          if (!deptData[dept]) {
                            deptData[dept] = {
                              name: dept,
                              avgScore: 0,
                              totalScore: 0,
                              totalCount: 0,
                              codingScore: 0,
                              mcqScore: 0,
                              studentCount: new Set(),
                            };
                          }

                          deptData[dept].totalScore +=
                            (sub.totalScore / sub.maxScore) * 100;
                          deptData[dept].totalCount += 1;
                          deptData[dept].codingScore += sub.codingScore || 0;
                          deptData[dept].mcqScore += sub.mcqScore || 0;
                          deptData[dept].studentCount.add(sub.student.id);
                        });

                      // Calculate averages
                      Object.values(deptData).forEach((dept) => {
                        dept.avgScore = dept.totalScore / dept.totalCount;
                        dept.studentCount = dept.studentCount.size;
                      });

                      // Convert to array for chart
                      const chartData = Object.values(deptData);

                      return (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#334155"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="name"
                              tick={{
                                fill: "#9ca3af",
                                fontFamily: "monospace",
                              }}
                            />
                            <YAxis
                              tick={{
                                fill: "#9ca3af",
                                fontFamily: "monospace",
                              }}
                              domain={[0, 100]}
                              label={{
                                value: "Score %",
                                angle: -90,
                                position: "insideLeft",
                                style: {
                                  fill: "#9ca3af",
                                  fontFamily: "monospace",
                                },
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                borderColor: "#475569",
                                color: "#e2e8f0",
                                borderRadius: "0.375rem",
                                fontFamily: "monospace",
                              }}
                              itemStyle={{ color: "#e2e8f0" }}
                              formatter={(value, name) => {
                                if (name === "Average Score")
                                  return [`${value.toFixed(1)}%`, name];
                                if (name === "Student Count")
                                  return [value, name];
                                return [value, name];
                              }}
                              labelStyle={{
                                fontFamily: "monospace",
                                color: "#e2e8f0",
                              }}
                            />
                            <Legend
                              verticalAlign="top"
                              height={36}
                              wrapperStyle={{ fontFamily: "monospace" }}
                            />
                            <Bar
                              dataKey="avgScore"
                              name="Average Score"
                              fill="#3b82f6"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="studentCount"
                              name="Student Count"
                              fill="#22c55e"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-slate-400 font-mono">
                    <div className="text-center">
                      <div className="text-cyan-500 text-4xl mb-4">{"[ ]"}</div>
                      <p>No data available for visualization</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={
            submissionData.flatMap((group) => group.submissions).length === 0
          }
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data (CSV)
        </Button>
      </div>
    </div>
  );
}
