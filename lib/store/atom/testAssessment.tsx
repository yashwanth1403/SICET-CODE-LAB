import { atom } from "jotai";

export interface ProblemSubmission {
  code: string;
  language: string;
  lastSaved: string; // ISO date string
  // For MCQ questions
  selectedChoiceId?: string | null;
  isCorrect?: boolean;
  questionNumber?: number; // To store the question number for display
  questionPreview?: string; // First 30-50 chars of the question for display
  results?: {
    status: string;
    output?: string;
    error?: string;
    executionTime?: number;
    memory?: number;
    testsPassed?: number;
    totalTests?: number;
  };
}

export interface TestProblem {
  id: string;
  title: string;
  difficulty?: "Easy" | "Medium" | "Hard"; // Optional for MCQs
  description: string;
  questionType: "CODING" | "MULTIPLE_CHOICE";
  score: number;
  testCases?: {
    id: string;
    input: string;
    output: string;
    isHidden: boolean;
  }[];
  languages?: {
    id: string;
    name: string;
    functionSignature: string;
    codePrefix: string;
    starterCode: string;
    codeSuffix: string;
  }[];
  choices: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  submission?: ProblemSubmission;
}

export interface TestAssessmentType {
  id: string;
  title: string;
  batch: string[];
  departments: string[];
  startTime: string;
  endTime: string;
  duration: number;
  problems: TestProblem[];
  totalQuestions: number;
  topics: string[];
  status: "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "ARCHIVED";
  attemptData?: {
    startTime: string;
    endTime: string;
    duration: number;
    attemptId: string;
  };
  userId?: string;
  studentId?: string;
  user?: {
    id: string;
  };
}

// Main assessment atom
export const assessmentAtom = atom<TestAssessmentType | null>(null);

// Create an atom for handling a specific problem's submission
export const createProblemSubmissionAtom = (problemId: string) => {
  return atom(
    // Getter
    (get) => {
      const assessment = get(assessmentAtom);
      if (!assessment || !assessment.problems) {
        return null;
      }

      const problem = assessment.problems.find((p) => p.id === problemId);
      return problem?.submission || null;
    },
    // Setter
    (get, set, submission: ProblemSubmission) => {
      const assessment = get(assessmentAtom);
      if (!assessment || !assessment.problems) {
        return;
      }

      // Create a copy of the assessment
      const updatedAssessment = { ...assessment };

      // Find the problem to get more information for the submission
      const problem = assessment.problems.find((p) => p.id === problemId);

      // Enhance submission with additional info for better display
      if (problem) {
        // Add question number (index + 1) in the problems array
        const questionIndex = assessment.problems.findIndex(
          (p) => p.id === problemId
        );
        submission.questionNumber =
          questionIndex >= 0 ? questionIndex + 1 : undefined;

        // Add a preview of the question for display
        // Strip HTML tags and limit length
        if (problem.description) {
          const strippedDescription = problem.description.replace(
            /<[^>]*>/g,
            ""
          );
          submission.questionPreview =
            strippedDescription.substring(0, 50) +
            (strippedDescription.length > 50 ? "..." : "");
        }

        // For MCQ, determine if the selected choice is correct
        if (
          problem.questionType === "MULTIPLE_CHOICE" &&
          submission.selectedChoiceId
        ) {
          const selectedChoice = problem.choices?.find(
            (c) => c.id === submission.selectedChoiceId
          );
          submission.isCorrect = selectedChoice?.isCorrect || false;

          // If this is a correct answer, set the status to PASSED for consistency
          if (submission.isCorrect) {
            if (!submission.results) {
              submission.results = { status: "PASSED" };
            } else {
              submission.results.status = "PASSED";
            }
          } else {
            if (!submission.results) {
              submission.results = { status: "FAILED" };
            } else {
              submission.results.status = "FAILED";
            }
          }
        }
      }

      // Update the submission for the specific problem
      updatedAssessment.problems = assessment.problems.map((problem) => {
        if (problem.id === problemId) {
          return { ...problem, submission };
        }
        return problem;
      });

      // Update the assessment atom
      set(assessmentAtom, updatedAssessment);

      // Save to localStorage - use different keys for different question types
      let storageKey;
      if (problem?.questionType === "MULTIPLE_CHOICE") {
        storageKey = `assessment_mcq_${assessment.id}_${problemId}`;
      } else {
        storageKey = `assessment_code_${assessment.id}_${problemId}`;
      }
      localStorage.setItem(storageKey, JSON.stringify(submission));
    }
  );
};

// Create a read-only atom that retrieves a specific problem by ID
export const createProblemAtom = (problemId: string) => {
  return atom((get) => {
    const assessment = get(assessmentAtom);

    if (!assessment || !assessment.problems) {
      return null;
    }

    // Find the problem with the matching ID
    return (
      assessment.problems.find((problem) => problem.id === problemId) || null
    );
  });
};

// Utility function to get all submissions from localStorage for an assessment
export const loadSubmissionsFromLocalStorage = (assessmentId: string) => {
  const submissions: Record<string, ProblemSubmission> = {};

  // We need to scan all localStorage items for the assessment ID pattern
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    // Check if this key is a submission for our assessment
    if (
      key &&
      (key.startsWith(`assessment_code_${assessmentId}_`) ||
        key.startsWith(`assessment_mcq_${assessmentId}_`))
    ) {
      // Extract the problem ID from the key
      const problemId = key.split("_").pop();
      if (problemId) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            submissions[problemId] = JSON.parse(data);
          }
        } catch (e) {
          console.error(
            `Error parsing submission for problem ${problemId}:`,
            e
          );
        }
      }
    }
  }

  return submissions;
};
