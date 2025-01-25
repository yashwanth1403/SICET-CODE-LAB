"use client";
import React, { useEffect, useState } from "react";
import {
  Plus,
  Clock,
  Calendar,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAssessmentHandler } from "@/actions/CreateAssessment";
import { useSession } from "next-auth/react";

interface TestCase {
  input: string;
  output: string;
  score: number;
  isHidden: boolean;
}

interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  testCases: TestCase[];
}

// Removed duplicate Assessment interface

interface ValidationErrors {
  [key: string]: string;
}

interface BasicDetailsProps {
  assessment: Assessment;
  setAssessment: React.Dispatch<React.SetStateAction<Assessment>>;
  errors: ValidationErrors;
}

type UpdateTestCaseFunction = (
  problemIndex: number,
  testCaseIndex: number,
  field: keyof TestCase,
  value: string | number | boolean
) => void;

interface TestCaseProps {
  testCase: TestCase;
  testCaseIndex: number;
  problemIndex: number;
  updateTestCase: (
    problemIndex: number,
    testCaseIndex: number,
    field: keyof TestCase,
    value: string | number | boolean
  ) => void;
  removeTestCase: (problemIndex: number, testCaseIndex: number) => void;
  errors: ValidationErrors;
}

interface ProblemProps {
  problem: Problem;
  problemIndex: number;
  updateProblem: (
    problemIndex: number,
    field: keyof Problem,
    value: string
  ) => void;
  removeProblem: (problemIndex: number) => void;
  addTestCase: (problemIndex: number) => void;
  removeTestCase: (problemIndex: number, testCaseIndex: number) => void;
  updateTestCase: (
    problemIndex: number,
    testCaseIndex: number,
    field: keyof TestCase,
    value: string | number | boolean
  ) => void;
  errors: ValidationErrors;
}

interface ProblemsAndTestCasesProps {
  assessment: Assessment;
  addProblem: () => void;
  removeProblem: (problemIndex: number) => void;
  updateProblem: (
    problemIndex: number,
    field: keyof Problem,
    value: string
  ) => void;
  addTestCase: (problemIndex: number) => void;
  removeTestCase: (problemIndex: number, testCaseIndex: number) => void;
  updateTestCase: (
    problemIndex: number,
    testCaseIndex: number,
    field: keyof TestCase,
    value: string | number | boolean
  ) => void;
  errors: ValidationErrors;
}

interface ScheduleProps {
  assessment: Assessment;
  setAssessment: React.Dispatch<React.SetStateAction<Assessment>>;
  errors: ValidationErrors;
}

interface ReviewProps {
  assessment: Assessment;
}

interface ProgressStepsProps {
  steps: string[];
  activeStep: number;
}

interface NavigationButtonsProps {
  activeStep: number;
  steps: string[];
  handleNext: () => void;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
}

interface Assessment {
  title: string;
  year: string;
  departments: string[];
  startTime: string;
  endTime: string;
  duration: number;
  totalQuestions: number;
  topics: string[];
  problems: Problem[];
}

// Departments list
const DEPARTMENTS = [
  "CSE",
  "AIML",
  "Mechanical Engineering",
  "Civil Engineering",
  "Business Administration",
  "Data Science",
  "Cybersecurity",
];

// Basic Details Component
const BasicDetails: React.FC<BasicDetailsProps> = ({
  assessment,
  setAssessment,
  errors,
}) => {
  // Add state for raw input
  const [topicsInput, setTopicsInput] = useState(assessment.topics.join(", "));

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Basic Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Assessment Title
            </label>
            <input
              type="text"
              className={`w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2.5 ${
                errors.title ? "border-red-500" : ""
              }`}
              placeholder="e.g., Data Structures Mid-Term"
              value={assessment.title}
              onChange={(e) =>
                setAssessment({ ...assessment, title: e.target.value })
              }
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Select Year
            </label>
            <select
              className={`w-full bg-gray-700 text-white rounded-lg p-2.5 ${
                errors.year ? "border-red-500" : ""
              }`}
              value={assessment.year}
              onChange={(e) =>
                setAssessment({ ...assessment, year: e.target.value })
              }
            >
              <option value="">Select Year</option>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>
            {errors.year && (
              <p className="text-red-500 text-sm mt-1">{errors.year}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Select Departments
            </label>
            <div className="bg-gray-700 rounded-lg p-2.5">
              {DEPARTMENTS.map((dept) => (
                <label key={dept} className="block mb-1 text-gray-300">
                  <input
                    type="checkbox"
                    className="mr-2 text-white"
                    checked={assessment.departments.includes(dept)}
                    onChange={(e) => {
                      const updatedDepts = e.target.checked
                        ? [...assessment.departments, dept]
                        : assessment.departments.filter((d) => d !== dept);
                      setAssessment({
                        ...assessment,
                        departments: updatedDepts,
                      });
                    }}
                  />
                  {dept}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Topics Covered
            </label>
            <input
              type="text"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2.5"
              placeholder="e.g., Arrays, Dynamic Programming, Trees (comma separated)"
              value={topicsInput}
              onChange={(e) => {
                const newValue = e.target.value;
                setTopicsInput(newValue);

                // Update assessment.topics array
                setAssessment({
                  ...assessment,
                  topics: newValue
                    .split(",")
                    .map((topic) => topic.trim())
                    .filter(Boolean),
                });
              }}
              onBlur={() => {
                // Clean up on blur
                const cleanedTopics = topicsInput
                  .split(",")
                  .map((topic) => topic.trim())
                  .filter(Boolean);
                setTopicsInput(cleanedTopics.join(", "));
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
// Test Case Component
const TestCase: React.FC<TestCaseProps> = ({
  testCase,
  testCaseIndex,
  problemIndex,
  updateTestCase,
  removeTestCase,
  errors,
}) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h5 className="text-white">Test Case {testCaseIndex + 1}</h5>
        <button
          onClick={() => removeTestCase(problemIndex, testCaseIndex)}
          className="text-gray-400 hover:text-white"
          type="button"
        >
          <X size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Input</label>
          <textarea
            className={`w-full bg-gray-700 text-white rounded-lg p-2.5 ${
              errors[`problem${problemIndex}TestCase${testCaseIndex}Input`]
                ? "border-red-500"
                : ""
            }`}
            rows={3}
            placeholder="Test case input"
            value={testCase.input}
            onChange={(e) =>
              updateTestCase(
                problemIndex,
                testCaseIndex,
                "input",
                e.target.value
              )
            }
          />
          {errors[`problem${problemIndex}TestCase${testCaseIndex}Input`] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`problem${problemIndex}TestCase${testCaseIndex}Input`]}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Expected Output
          </label>
          <textarea
            className={`w-full bg-gray-700 text-white rounded-lg p-2.5 ${
              errors[`problem${problemIndex}TestCase${testCaseIndex}Output`]
                ? "border-red-500"
                : ""
            }`}
            rows={3}
            placeholder="Expected output"
            value={testCase.output}
            onChange={(e) =>
              updateTestCase(
                problemIndex,
                testCaseIndex,
                "output",
                e.target.value
              )
            }
          />
          {errors[`problem${problemIndex}TestCase${testCaseIndex}Output`] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`problem${problemIndex}TestCase${testCaseIndex}Output`]}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Score</label>
          <input
            type="number"
            className={`w-24 bg-gray-700 text-white rounded-lg p-2 ${
              errors[`problem${problemIndex}TestCase${testCaseIndex}Score`]
                ? "border-red-500"
                : ""
            }`}
            placeholder="Score"
            value={testCase.score}
            onChange={(e) =>
              updateTestCase(
                problemIndex,
                testCaseIndex,
                "score",
                Number(e.target.value)
              )
            }
          />
          {errors[`problem${problemIndex}TestCase${testCaseIndex}Score`] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`problem${problemIndex}TestCase${testCaseIndex}Score`]}
            </p>
          )}
        </div>
        <label className="flex items-center gap-2 text-gray-400">
          <input
            type="checkbox"
            className="rounded bg-gray-700"
            checked={testCase.isHidden}
            onChange={(e) =>
              updateTestCase(
                problemIndex,
                testCaseIndex,
                "isHidden",
                e.target.checked
              )
            }
          />
          Hidden Test Case
        </label>
      </div>
    </div>
  );
};

// Problem Component

const Problem: React.FC<ProblemProps> = ({
  problem,
  problemIndex,
  updateProblem,
  removeProblem,
  addTestCase,
  removeTestCase,
  updateTestCase,
  errors,
}) => {
  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-lg font-medium">
            Problem {problemIndex + 1}
          </span>
          <select
            className="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 hover:border-gray-500 transition-colors"
            value={problem.difficulty}
            onChange={(e) =>
              updateProblem(problemIndex, "difficulty", e.target.value)
            }
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>
        <button
          onClick={() => removeProblem(problemIndex)}
          className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <input
            type="text"
            className={`w-full bg-gray-700 text-white rounded-lg p-4 text-lg font-medium border border-gray-600 hover:border-gray-500 transition-colors ${
              errors[`problem${problemIndex}Title`] ? "border-red-500" : ""
            }`}
            placeholder="Enter Problem Title"
            value={problem.title}
            onChange={(e) =>
              updateProblem(problemIndex, "title", e.target.value)
            }
          />
          {errors[`problem${problemIndex}Title`] && (
            <p className="text-red-500 text-sm mt-2">
              {errors[`problem${problemIndex}Title`]}
            </p>
          )}
        </div>

        <div>
          <textarea
            className={`w-full bg-gray-700 text-white rounded-lg p-4 min-h-[300px] border border-gray-600 hover:border-gray-500 transition-colors ${
              errors[`problem${problemIndex}Description`]
                ? "border-red-500"
                : ""
            }`}
            placeholder="Problem Description - Include detailed instructions, constraints, and examples"
            value={problem.description}
            onChange={(e) =>
              updateProblem(problemIndex, "description", e.target.value)
            }
          />
          {errors[`problem${problemIndex}Description`] && (
            <p className="text-red-500 text-sm mt-2">
              {errors[`problem${problemIndex}Description`]}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium text-white">Test Cases</h4>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
              onClick={() => addTestCase(problemIndex)}
            >
              <Plus size={16} /> Add Test Case
            </button>
          </div>

          <div className="grid gap-4">
            {problem.testCases.map((testCase, testCaseIndex) => (
              <TestCase
                key={testCaseIndex}
                testCase={testCase}
                testCaseIndex={testCaseIndex}
                problemIndex={problemIndex}
                updateTestCase={updateTestCase}
                removeTestCase={removeTestCase}
                errors={errors}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
// Problems & Test Cases Component
const ProblemsAndTestCases: React.FC<ProblemsAndTestCasesProps> = ({
  assessment,
  addProblem,
  removeProblem,
  updateProblem,
  addTestCase,
  removeTestCase,
  updateTestCase,
  errors,
}) => {
  return (
    <div className="relative px-4">
      {/* Problems Container */}
      <div
        className="overflow-x-auto flex gap-6 pb-6 pt-2 px-2 snap-x snap-mandatory scroll-smooth"
        style={{ scrollBehavior: "smooth" }}
      >
        {assessment.problems.map((problem, problemIndex) => (
          <div
            key={problemIndex}
            className="min-w-[450px] max-w-[450px] snap-center transform transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
              {/* Problem Header */}
              <div className="bg-gray-900 px-6 py-4 border-b border-gray-700 sticky top-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    Problem {problemIndex + 1}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium
                      ${
                        problem.difficulty === "Easy"
                          ? "bg-green-500/20 text-green-400"
                          : problem.difficulty === "Medium"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                    <button
                      onClick={() => removeProblem(problemIndex)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Problem Content */}
              <div className="p-6">
                <Problem
                  problem={problem}
                  problemIndex={problemIndex}
                  updateProblem={updateProblem}
                  removeProblem={removeProblem}
                  addTestCase={addTestCase}
                  removeTestCase={removeTestCase}
                  updateTestCase={updateTestCase}
                  errors={errors}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add Problem Card */}
        <div className="min-w-[450px] snap-center flex items-center justify-center">
          <button
            onClick={addProblem}
            className="group flex flex-col items-center gap-3 bg-gray-800/50 hover:bg-gray-800 
              border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl p-8
              transition-all duration-200 hover:shadow-xl"
          >
            <div className="p-3 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20">
              <Plus size={24} className="text-blue-400" />
            </div>
            <span className="text-gray-400 group-hover:text-white font-medium">
              Add New Problem
            </span>
          </button>
        </div>
      </div>

      {/* Scroll Buttons */}
      <button
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-800/90 hover:bg-gray-800 
          p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200
          border border-gray-700 hover:border-gray-600"
        onClick={() =>
          document.querySelector(".overflow-x-auto")?.scrollBy(-470, 0)
        }
      >
        <ChevronLeft size={20} className="text-gray-400" />
      </button>
      <button
        className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-800/90 hover:bg-gray-800 
          p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200
          border border-gray-700 hover:border-gray-600"
        onClick={() =>
          document.querySelector(".overflow-x-auto")?.scrollBy(470, 0)
        }
      >
        <ChevronRight size={20} className="text-gray-400" />
      </button>
    </div>
  );
};

// Schedule Component
const Schedule: React.FC<ScheduleProps> = ({
  assessment,
  setAssessment,
  errors,
}) => {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Start Time
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="datetime-local"
                className={`w-full bg-gray-700 border-gray-600 text-white rounded-lg pl-10 p-2.5 ${
                  errors.startTime ? "border-red-500" : ""
                }`}
                value={assessment.startTime}
                onChange={(e) =>
                  setAssessment({ ...assessment, startTime: e.target.value })
                }
              />
              {errors.startTime && (
                <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              End Time
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="datetime-local"
                className={`w-full bg-gray-700 border-gray-600 text-white rounded-lg pl-10 p-2.5 ${
                  errors.endTime ? "border-red-500" : ""
                }`}
                value={assessment.endTime}
                onChange={(e) =>
                  setAssessment({ ...assessment, endTime: e.target.value })
                }
              />
              {errors.endTime && (
                <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Duration (minutes)
            </label>
            <div className="relative">
              <Clock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="number"
                className={`w-full bg-gray-700 border-gray-600 text-white rounded-lg pl-10 p-2.5 ${
                  errors.duration ? "border-red-500" : ""
                }`}
                placeholder="120"
                value={assessment.duration}
                onChange={(e) =>
                  setAssessment({
                    ...assessment,
                    duration: Number(e.target.value),
                  })
                }
              />
              {errors.duration && (
                <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Review Component
// ... Previous components remain the same ...

// Review Component (continued)
const Review: React.FC<ReviewProps> = ({ assessment }) => {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Review Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 text-white">
          <div>
            <h3 className="font-medium mb-2">Basic Details</h3>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p>
                <span className="text-gray-400">Title:</span> {assessment.title}
              </p>
              <p>
                <span className="text-gray-400">Description:</span>{" "}
                {assessment.year}
              </p>
              <p>
                <span className="text-gray-400">Topics:</span>{" "}
                {assessment.topics.join(", ")}
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">
              Problems ({assessment.problems.length})
            </h3>
            <div className="space-y-4">
              {assessment.problems.map((problem, index) => (
                <div key={problem.id} className="bg-gray-700 p-4 rounded-lg">
                  <p>
                    <span className="text-gray-400">Problem {index + 1}:</span>{" "}
                    {problem.title}
                  </p>
                  <p>
                    <span className="text-gray-400">Difficulty:</span>{" "}
                    {problem.difficulty}
                  </p>
                  <p>
                    <span className="text-gray-400">Test Cases:</span>{" "}
                    {problem.testCases.length}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Schedule</h3>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p>
                <span className="text-gray-400">Start Time:</span>{" "}
                {new Date(assessment.startTime).toLocaleString()}
              </p>
              <p>
                <span className="text-gray-400">End Time:</span>{" "}
                {new Date(assessment.endTime).toLocaleString()}
              </p>
              <p>
                <span className="text-gray-400">Duration:</span>{" "}
                {assessment.duration} minutes
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Progress Steps Component
const ProgressSteps: React.FC<ProgressStepsProps> = ({ steps, activeStep }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index <= activeStep
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                  : "bg-gray-700"
              } text-white`}
            >
              {index + 1}
            </div>
            <div className="ml-2">
              <p
                className={`${
                  index <= activeStep ? "text-white" : "text-gray-500"
                }`}
              >
                {step}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-24 h-0.5 mx-4 ${
                  index < activeStep
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                    : "bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Navigation Buttons Component
const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  activeStep,
  steps,
  handleNext,
  setActiveStep,
}) => {
  return (
    <div className="flex justify-between mt-8">
      <button
        onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
        className={`px-4 py-2 rounded-lg ${
          activeStep === 0
            ? "bg-gray-700 text-gray-400"
            : "bg-gray-700 text-white hover:bg-gray-600"
        }`}
        disabled={activeStep === 0}
      >
        Previous
      </button>
      <button
        onClick={handleNext}
        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
      >
        {activeStep === steps.length - 1 ? "Create Assessment" : "Next"}
        <ArrowRight size={16} />
      </button>
    </div>
  );
};

// Main Dashboard Component
const CreateAssessment: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const { data: session, status } = useSession();
  const [proffessorId, setProffessorId] = useState<string>("");
  const [isClient, SetIsClient] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<Assessment>({
    title: "",
    year: "",
    departments: [],
    startTime: "",
    endTime: "",
    duration: 120,
    totalQuestions: 1,
    topics: [],
    problems: [
      {
        id: 1,
        title: "",
        description: "",
        difficulty: "Easy",
        testCases: [
          {
            input: "",
            output: "",
            score: 0,
            isHidden: false,
          },
        ],
      },
    ],
  });

  const steps = [
    "Basic Details",
    "Problems & Test Cases",
    "Schedule",
    "Review",
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 0) {
      if (!assessment.title.trim()) newErrors.title = "Title is required";
      if (!assessment.year) newErrors.year = "Year is required";
      if (assessment.departments.length === 0)
        newErrors.departments = "Select at least one department";
    } else if (step === 1) {
      assessment.problems.forEach((problem, idx) => {
        if (!problem.title.trim())
          newErrors[`problem${idx}Title`] = "Problem title is required";
        if (!problem.description.trim())
          newErrors[`problem${idx}Description`] =
            "Problem description is required";
        problem.testCases.forEach((testCase, testIdx) => {
          if (!testCase.input.trim())
            newErrors[`problem${idx}TestCase${testIdx}Input`] =
              "Input is required";
          if (!testCase.output.trim())
            newErrors[`problem${idx}TestCase${testIdx}Output`] =
              "Output is required";
          if (testCase.score <= 0)
            newErrors[`problem${idx}TestCase${testIdx}Score`] =
              "Score must be greater than 0";
        });
      });
    } else if (step === 2) {
      if (!assessment.startTime) newErrors.startTime = "Start time is required";
      if (!assessment.endTime) newErrors.endTime = "End time is required";
      if (assessment.duration <= 0)
        newErrors.duration = "Duration must be greater than 0";
      if (
        assessment.startTime &&
        assessment.endTime &&
        new Date(assessment.startTime) >= new Date(assessment.endTime)
      ) {
        newErrors.endTime = "End time must be after start time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep(activeStep)) {
      if (activeStep === steps.length - 1) {
        console.log();
        console.log("Submit assessment:", assessment);
        const createAssessmentResult = await createAssessmentHandler({
          title: assessment.title,
          year: assessment.year,
          departments: assessment.departments,
          startTime: assessment.startTime,
          endTime: assessment.endTime,
          duration: assessment.duration,
          totalQuestions: assessment.problems.length,
          topics: assessment.topics,
          problems: assessment.problems,
          professorId: "cm60uxw0e0001uxcgswdcjw2e",
        });
        if (createAssessmentResult) alert("Assessment Created Successfully");
        else alert("Failed to create assessment");
      } else {
        setActiveStep(activeStep + 1);
      }
    }
  };

  const addProblem = () => {
    setAssessment((prev) => ({
      ...prev,
      problems: [
        ...prev.problems,
        {
          id: prev.problems.length + 1,
          title: "",
          description: "",
          difficulty: "Easy",
          testCases: [
            {
              input: "",
              output: "",
              score: 0,
              isHidden: false,
            },
          ],
        },
      ],
    }));
  };

  const addTestCase = (problemIndex: number) => {
    const updatedProblems = [...assessment.problems];
    updatedProblems[problemIndex].testCases.push({
      input: "",
      output: "",
      score: 0,
      isHidden: false,
    });
    setAssessment({ ...assessment, problems: updatedProblems });
  };

  const removeTestCase = (problemIndex: number, testCaseIndex: number) => {
    const updatedProblems = [...assessment.problems];
    if (updatedProblems[problemIndex].testCases.length > 1) {
      updatedProblems[problemIndex].testCases.splice(testCaseIndex, 1);
      setAssessment({ ...assessment, problems: updatedProblems });
    }
  };

  const removeProblem = (problemIndex: number) => {
    if (assessment.problems.length > 1) {
      const updatedProblems = assessment.problems.filter(
        (_, idx) => idx !== problemIndex
      );
      setAssessment({ ...assessment, problems: updatedProblems });
    }
  };

  const updateProblem = (
    problemIndex: number,
    field: keyof Problem,
    value: string
  ) => {
    const updatedProblems = [...assessment.problems];
    updatedProblems[problemIndex] = {
      ...updatedProblems[problemIndex],
      [field]: value,
    };
    setAssessment({ ...assessment, problems: updatedProblems });
  };

  const getMaxScoreByDifficulty = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return 100;
      case "Medium":
        return 200;
      case "Hard":
        return 300;
      default:
        return 100;
    }
  };

  const updateTestCase: UpdateTestCaseFunction = (
    problemIndex,
    testCaseIndex,
    field,
    value
  ) => {
    const updatedProblems = [...assessment.problems];
    const problem = updatedProblems[problemIndex];

    if (field === "score") {
      const numValue = Number(value);
      const maxScore = getMaxScoreByDifficulty(problem.difficulty);
      const totalOtherScores = problem.testCases
        .filter((_, idx) => idx !== testCaseIndex)
        .reduce((sum, tc) => sum + tc.score, 0);

      // Validate score doesn't exceed max
      if (totalOtherScores + numValue > maxScore) {
        setErrors({
          ...errors,
          [`problem${problemIndex}TestCase${testCaseIndex}Score`]: `Total score cannot exceed ${maxScore} for ${problem.difficulty} difficulty`,
        });
        return;
      }

      updatedProblems[problemIndex].testCases[testCaseIndex] = {
        ...problem.testCases[testCaseIndex],
        score: numValue,
      };
    } else {
      updatedProblems[problemIndex].testCases[testCaseIndex] = {
        ...problem.testCases[testCaseIndex],
        [field]: value,
      };
    }

    setAssessment({ ...assessment, problems: updatedProblems });
  };

  useEffect(() => {
    if (status !== "loading") {
      if (session) if (session.user.id) setProffessorId(session.user.id);
    }
    SetIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading....</div>;
  }
  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            Create New Assessment
          </h1>
          <p className="text-gray-400 mt-2">
            Build your coding assessment in simple steps
          </p>
        </div>

        <ProgressSteps steps={steps} activeStep={activeStep} />

        {/* Main Content */}
        <div className="space-y-6 w-full">
          {activeStep === 0 && (
            <BasicDetails
              assessment={assessment}
              setAssessment={setAssessment}
              errors={errors}
            />
          )}

          {activeStep === 1 && (
            <ProblemsAndTestCases
              assessment={assessment}
              addProblem={addProblem}
              removeProblem={removeProblem}
              updateProblem={updateProblem}
              addTestCase={addTestCase}
              removeTestCase={removeTestCase}
              updateTestCase={updateTestCase}
              errors={errors}
            />
          )}

          {activeStep === 2 && (
            <Schedule
              assessment={assessment}
              setAssessment={setAssessment}
              errors={errors}
            />
          )}

          {activeStep === 3 && <Review assessment={assessment} />}

          <NavigationButtons
            activeStep={activeStep}
            steps={steps}
            handleNext={handleNext}
            setActiveStep={setActiveStep}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateAssessment;
