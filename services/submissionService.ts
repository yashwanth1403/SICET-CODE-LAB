// services/submissionService.ts
import axios from "axios";
import { Status } from "@prisma/client";

// Base API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// Better type for test results
export interface TestResult {
  passed: number;
  total: number;
  cases: Array<{
    input: string;
    expectedOutput: string;
    actualOutput: string | null;
    error: string | null;
    passed: boolean;
    executionTime?: number;
    memory?: number;
  }>;
}

export interface SubmissionRequest {
  code: string;
  language: string;
  status: Status;
  score: number;
  studentId?: string;
  problemId: string;
  executionTime?: number;
  memoryUsed?: number;
  errorMessage?: string;
  testResults?: TestResult;
}

export interface SubmissionResult {
  id: string;
  code: string;
  language: string;
  status: Status;
  score: number;
  studentId: string;
  problemId: string;
  createdAt: string;
  executionTime?: number;
  memoryUsed?: number;
  errorMessage?: string;
  testResults?: TestResult;
}

/**
 * Save a submission to the database
 */
export const saveSubmission = async ({
  code,
  language,
  status,
  score,
  studentId,
  problemId,
  assessmentId,
  executionTime,
  memoryUsed,
  errorMessage,
  testResults,
  questionNumber,
  questionPreview,
}: {
  code: string;
  language: string;
  status: Status;
  score: number;
  studentId?: string;
  problemId: string;
  assessmentId: string;
  executionTime?: number | null;
  memoryUsed?: number | null;
  errorMessage?: string | null;
  testResults?: TestResult;
  questionNumber?: number;
  questionPreview?: string;
}) => {
  try {
    // Validate required fields to avoid API errors
    if (!problemId) throw new Error("Problem ID is required");
    if (!assessmentId) throw new Error("Assessment ID is required");
    if (!code) throw new Error("Code is required");
    if (!language) throw new Error("Language is required");

    // Create the request payload - only include fields that the API endpoint expects
    const payload = {
      code,
      language,
      status,
      score,
      ...(studentId && { studentId }),
      problemId,
      executionTime,
      memoryUsed,
      errorMessage,
      testResults,
      questionNumber,
      questionPreview,
      assessmentId,
    };

    const response = await fetch("/api/submissions/coding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Try to parse error information from the response
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        // If it's not JSON, just get the status text
        errorData = { error: response.statusText };
      }

      // Create a more structured error object
      const errorObj = new Error(
        errorData.error ||
          errorData.details ||
          `Failed to save submission. Status: ${response.status}`
      );
      // Add additional properties to the error object
      Object.assign(errorObj, {
        status: response.status,
        errorData,
        apiResponse: true,
      });
      throw errorObj;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Enhanced error logging
    console.error("Error in saveSubmission:", error);
    console.error("Submission parameters:", {
      problemId,
      language,
      assessmentId,
      studentId: studentId
        ? studentId.substring(0, 8) + "..."
        : "using server auth",
    });

    // Rethrow with more details if possible
    if (error instanceof Error) {
      throw new Error(`Failed to save submission: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Get all submissions for a specific problem
 */
export const getSubmissions = async (
  problemId: string,
  studentId?: string
): Promise<SubmissionResult[]> => {
  try {
    let url = `${API_URL}/submissions?problemId=${problemId}`;

    if (studentId) {
      url += `&studentId=${studentId}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error getting submissions:", error);
    throw error;
  }
};

/**
 * Get the latest submission for a specific problem and student
 */
export const getLatestSubmission = async (
  problemId: string,
  studentId: string
): Promise<SubmissionResult | null> => {
  try {
    const response = await axios.get(
      `${API_URL}/submissions/latest?problemId=${problemId}&studentId=${studentId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting latest submission:", error);
    return null;
  }
};

/**
 * Calculate score based on test results
 * @param testResults Test results from Judge0
 * @param maxScore Maximum score for the problem
 * @returns Calculated score
 */
export const calculateScore = (results: TestResult, maxScore: number) => {
  if (!results || !results.total) return 0;
  return Math.round((results.passed / results.total) * maxScore);
};

/**
 * Get all submissions for a student across all problems in an assessment
 */
export const getStudentAssessmentSubmissions = async (
  assessmentId: string,
  studentId: string
): Promise<Record<string, SubmissionResult>> => {
  try {
    const response = await axios.get(
      `${API_URL}/submissions/assessment?assessmentId=${assessmentId}&studentId=${studentId}`
    );

    // Convert array to object indexed by problemId for easier access
    const submissionsMap: Record<string, SubmissionResult> = {};
    response.data.forEach((submission: SubmissionResult) => {
      submissionsMap[submission.problemId] = submission;
    });

    return submissionsMap;
  } catch (error) {
    console.error("Error getting student assessment submissions:", error);
    return {};
  }
};
