"use client";
import React, { useEffect, useState } from "react";
import { createAssessmentHandler } from "@/actions/CreateAssessment";
import { useSession } from "next-auth/react";
import { ProgressSteps } from "./AdminAssement/ProgressSteps";
import { BasicDetails } from "./AdminAssement/BasicDetails";
import { ProblemsAndTestCases } from "./AdminAssement/Problem";
import { Schedule } from "./AdminAssement/Schedule";
import { NavigationButtons } from "./AdminAssement/NavigationButtons";
import { Review } from "./AdminAssement/Review";

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

export interface ValidationErrors {
  [key: string]: string;
}

type UpdateTestCaseFunction = (
  problemIndex: number,
  testCaseIndex: number,
  field: keyof TestCase,
  value: string | number | boolean
) => void;

export interface Assessment {
  title: string;
  batches: string[];
  departments: string[];
  startTime: string;
  endTime: string;
  duration: number;
  totalQuestions: number;
  topics: string[];
  problems: Problem[];
}

// Main Dashboard Component
const CreateAssessment: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const { data: session, status } = useSession();
  const [proffessorId, setProffessorId] = useState<string>("");
  const [isClient, SetIsClient] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<Assessment>({
    title: "",
    batches: [],
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
      if (!assessment.batches) newErrors.batch = "batch is required";
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
        const createAssessmentResult = await createAssessmentHandler({
          ...assessment,
          professorId: "cm6keu1e00002uxm45o8fwbpi",
        });

        if (createAssessmentResult) {
          clearDraft(); // Clear draft after successful submission
          alert("Assessment Created Successfully");
        } else {
          alert("Failed to create assessment");
        }
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

  const DRAFT_KEY = "assessment_draft";

  const loadDraft = () => {
    if (typeof window !== "undefined") {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          setAssessment(parsedDraft);
          setActiveStep(parsedDraft.lastActiveStep || 0);
          return true;
        } catch (error) {
          console.error("Error loading draft:", error);
        }
      }
    }
    return false;
  };
  const saveDraft = () => {
    if (typeof window !== "undefined") {
      const draftData = {
        ...assessment,
        lastActiveStep: activeStep,
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    }
  };

  const clearDraft = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_KEY);
    }
  };

  // Auto-save on changes
  useEffect(() => {
    saveDraft();
  }, [assessment, activeStep]);

  // Load draft on mount
  useEffect(() => {
    if (!isClient) return;
    loadDraft();
  }, [isClient]);
  useEffect(() => {
    async function fetchData() {
      if (status !== "loading") {
        if (session) if (session.user.id) setProffessorId(session.user.id);
      }
      SetIsClient(true);
    }

    fetchData();
  }, []);

  if (!isClient) {
    return <div>Loading....</div>;
  }
  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Draft Status */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Create New Assessment
            </h1>
            <p className="text-gray-400 mt-2">
              Build your coding assessment in simple steps
            </p>
          </div>
          <div className="text-gray-400 text-sm">
            Draft auto-saved {new Date().toLocaleTimeString()}
          </div>
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
