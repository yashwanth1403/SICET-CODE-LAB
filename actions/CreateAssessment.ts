"use server";
import prisma from "@/lib/db";
import { DifficultyLevel, AssessmentStatus } from "@prisma/client";
import type {
  IProblem,
  ITestCase,
  IProblemLanguage,
  ProgrammingLanguage,
  IQuestionChoice,
  QuestionType,
} from "@/types";

// Define supported programming languages
type ProgrammingLanguage =
  | "C"
  | "C++"
  | "Java"
  | "Python"
  | "JavaScript"
  | "TypeScript"
  | "Ruby"
  | "Go"
  | "Rust";

interface CreateAssessmentParams {
  title: string;
  batches: string[];
  departments: string[];
  startTime: string;
  endTime: string;
  duration: number;
  totalQuestions: number;
  topics: string[];
  problems: IProblem[];
  professorId: string;
}

export async function createAssessmentHandler(params: CreateAssessmentParams) {
  try {
    // Validate environment
    if (typeof window !== "undefined") {
      throw new Error("This action can only be run on the server");
    }

    console.log("params", params);
    console.log("Problems count:", params.problems.length);
    console.log(
      "Problems types:",
      params.problems.map((p) => p.questionType)
    );

    // Validate required parameters
    if (!params.professorId) {
      throw new Error("Professor ID is required");
    }

    // Log masked database URL for debugging
    console.log(
      "Database URL:",
      process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace(/:[^@]+@/, ":****@")
        : "No DATABASE_URL found"
    );

    // Fetch the professor
    const professor = await prisma.professor.findUnique({
      where: { professorId: params.professorId },
    });

    if (!professor) {
      throw new Error("Invalid professor ID: Professor not found");
    }

    // Create assessment
    const newAssessment = await prisma.assessments.create({
      data: {
        title: params.title,
        batch: params.batches,
        departments: params.departments,
        startTime: new Date(params.startTime),
        endTime: new Date(params.endTime),
        duration: params.duration,
        totalQuestions: params.totalQuestions,
        topics: params.topics,
        status: AssessmentStatus.DRAFT,
        professorId: professor.id,
      },
    });

    // Create problems with test cases and languages
    console.log("Starting to create problems...");

    try {
      const problemCreationPromises = params.problems.map((problem, index) => {
        console.log(
          `Processing problem ${index + 1}, type: ${problem.questionType}`
        );

        // Validate and enforce requirements
        if (problem.questionType === "CODING") {
          // Make sure there are exactly 5 test cases with 3 visible and 2 hidden
          const visibleCount = problem.testCases.filter(
            (tc) => !tc.isHidden
          ).length;
          const hiddenCount = problem.testCases.filter(
            (tc) => tc.isHidden
          ).length;

          if (visibleCount < 3 || hiddenCount < 2) {
            console.warn(
              `Problem ${problem.title} doesn't have the required test cases. Adding default ones.`
            );

            // Create a complete set of test cases
            const defaultTestCases = [];

            // Keep existing test cases
            const existingVisible = problem.testCases.filter(
              (tc) => !tc.isHidden
            );
            const existingHidden = problem.testCases.filter(
              (tc) => tc.isHidden
            );

            // Add existing visible test cases (up to 3)
            for (let i = 0; i < Math.min(existingVisible.length, 3); i++) {
              defaultTestCases.push(existingVisible[i]);
            }

            // Add default visible test cases if needed
            for (let i = existingVisible.length; i < 3; i++) {
              defaultTestCases.push({
                input: "Default input " + (i + 1),
                output: "Default output " + (i + 1),
                isHidden: false,
              });
            }

            // Add existing hidden test cases (up to 2)
            for (let i = 0; i < Math.min(existingHidden.length, 2); i++) {
              defaultTestCases.push(existingHidden[i]);
            }

            // Add default hidden test cases if needed
            for (let i = existingHidden.length; i < 2; i++) {
              defaultTestCases.push({
                input: "Hidden input " + (i + 1),
                output: "Hidden output " + (i + 1),
                isHidden: true,
              });
            }

            // Replace test cases
            problem.testCases = defaultTestCases;
          }

          // Ensure proper score based on difficulty
          if (problem.difficulty === "Easy" && problem.score !== 10) {
            problem.score = 10;
          } else if (problem.difficulty === "Medium" && problem.score !== 20) {
            problem.score = 20;
          } else if (problem.difficulty === "Hard" && problem.score !== 30) {
            problem.score = 30;
          }
        } else if (problem.questionType === "MULTIPLE_CHOICE") {
          // Force score to be 1 for multiple choice questions
          problem.score = 1;

          // Set default difficulty for MCQ questions - required by the database schema
          problem.difficulty = problem.difficulty || "Easy";

          // Make sure there's at least one correct answer
          const hasCorrectAnswer = problem.choices?.some((c) => c.isCorrect);
          if (
            !hasCorrectAnswer &&
            problem.choices &&
            problem.choices.length > 0
          ) {
            problem.choices[0].isCorrect = true; // Set first choice as correct if none selected
          }

          // Ensure choices exist
          if (!problem.choices || problem.choices.length === 0) {
            problem.choices = [
              { text: "Option 1", isCorrect: true },
              { text: "Option 2", isCorrect: false },
              { text: "Option 3", isCorrect: false },
              { text: "Option 4", isCorrect: false },
            ];
          }
        }

        // Common problem data
        const problemData = {
          title:
            problem.title ||
            (problem.questionType === "MULTIPLE_CHOICE"
              ? "Multiple Choice Question"
              : "Coding Problem"),
          description: problem.description || "No description provided",
          difficulty: problem.difficulty as DifficultyLevel, // Required field
          score: problem.score,
          questionType: problem.questionType as QuestionType,
          assessmentId: newAssessment.id,
          professorId: professor.id,
        };

        // Log all problem data for debugging
        console.log(`Problem ${index + 1} data:`, {
          title: problemData.title,
          type: problemData.questionType,
          difficulty: problemData.difficulty,
          score: problemData.score,
          choicesCount:
            problem.questionType === "MULTIPLE_CHOICE"
              ? problem.choices?.length
              : undefined,
          testCasesCount:
            problem.questionType === "CODING"
              ? problem.testCases?.length
              : undefined,
        });

        try {
          // For coding questions, add test cases and languages
          if (problem.questionType === "CODING") {
            return prisma.problems.create({
              data: {
                ...problemData,
                // Create test cases
                testCases: {
                  create: problem.testCases.map((tc) => ({
                    input: tc.input || "Default input",
                    output: tc.output || "Default output",
                    isHidden: !!tc.isHidden,
                  })),
                },
                // Create languages with starter code
                languages: {
                  create: problem.languages.map((lang) => ({
                    name: lang.name as ProgrammingLanguage,
                    functionSignature:
                      lang.functionSignature || "function solution(input) {}",
                    starterCode: lang.starterCode || "// Your code here",
                    codePrefix: lang.codePrefix || "",
                    codeSuffix: lang.codeSuffix || "",
                  })),
                },
              },
            });
          }
          // For multiple choice questions, add choices
          else if (problem.questionType === "MULTIPLE_CHOICE") {
            // Make sure choices array is defined and has items
            if (!problem.choices || problem.choices.length === 0) {
              problem.choices = [
                { text: "Option 1", isCorrect: true },
                { text: "Option 2", isCorrect: false },
                { text: "Option 3", isCorrect: false },
                { text: "Option 4", isCorrect: false },
              ];
            }

            return prisma.problems.create({
              data: {
                ...problemData,
                // Create choices
                choices: {
                  create: problem.choices.map((choice) => ({
                    text: choice.text || "Default option",
                    isCorrect: !!choice.isCorrect,
                  })),
                },
              },
            });
          } else {
            console.warn(
              `Unknown question type for problem ${index + 1}: ${
                problem.questionType
              }`
            );
            // Create a generic coding problem as fallback
            return prisma.problems.create({
              data: {
                ...problemData,
                questionType: "CODING",
                testCases: {
                  create: [
                    {
                      input: "Default input",
                      output: "Default output",
                      isHidden: false,
                    },
                  ],
                },
                languages: {
                  create: [
                    {
                      name: "Python",
                      functionSignature: "def solution(input_data):",
                      codePrefix: "# Default code\ndef solution(input_data):",
                      starterCode: "    return input_data",
                      codeSuffix:
                        "\n\ninput_data = input()\nprint(solution(input_data))",
                    },
                  ],
                },
              },
            });
          }
        } catch (error) {
          console.error(`Error creating problem ${index + 1}:`, error);
          throw error;
        }
      });

      // Wait for all problem creations to complete
      console.log(
        `Waiting for ${problemCreationPromises.length} problem creation promises to complete...`
      );
      const createdProblems = await Promise.all(problemCreationPromises);
      console.log(`Successfully created ${createdProblems.length} problems`);

      return { success: true, data: newAssessment };
    } catch (error) {
      console.error("Comprehensive error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        name: error instanceof Error ? error.name : "Unknown error type",
        stack: error instanceof Error ? error.stack : "No stack trace",
        env: {
          DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
          NODE_ENV: process.env.NODE_ENV,
        },
      });

      return {
        success: false,
        error:
          error instanceof Error
            ? `${error.name}: ${error.message}`
            : "An unexpected error occurred",
      };
    }
  } catch (error) {
    console.error("Comprehensive error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      name: error instanceof Error ? error.name : "Unknown error type",
      stack: error instanceof Error ? error.stack : "No stack trace",
      env: {
        DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV,
      },
    });

    return {
      success: false,
      error:
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : "An unexpected error occurred",
    };
  }
}

// Function to track when a student attempts an assessment
export async function createAttemptTracker(
  studentId: string,
  assessmentId: string,
  duration: number
) {
  try {
    // Check if student has already attempted this assessment
    const existingAttempt = await prisma.attemptTracker.findUnique({
      where: {
        studentId_assessmentId: {
          studentId,
          assessmentId,
        },
      },
    });

    console.log(existingAttempt);
    console.log(studentId, assessmentId);

    // If an attempt already exists, return it
    if (existingAttempt) {
      return {
        success: true,
        message: "Existing attempt found",
        data: existingAttempt,
      };
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 60000);

    // Create a new attempt
    const attempt = await prisma.attemptTracker.create({
      data: {
        studentId,
        assessmentId,
        startTime: now,
        endTime: endTime,
        isCompleted: false,
      },
    });

    return { success: true, data: attempt };
  } catch (error) {
    console.error("Error creating attempt tracker:", error.stack);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create attempt",
    };
  }
}

// Function to mark an assessment attempt as completed
export async function completeAttempt(studentId: string, assessmentId: string) {
  try {
    const updatedAttempt = await prisma.attemptTracker.update({
      where: {
        studentId_assessmentId: {
          studentId,
          assessmentId,
        },
      },
      data: {
        endTime: new Date(),
        isCompleted: true,
      },
    });

    return { success: true, data: updatedAttempt };
  } catch (error) {
    console.error("Error completing attempt:", error.stack);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to complete attempt",
    };
  }
}

// New function to submit a solution or answer for any question type
export async function submitSolution(
  studentId: string,
  problemId: string,
  code?: string,
  language?: string,
  selectedChoiceId?: string
) {
  try {
    console.log(
      `Submitting solution for problem ${problemId} by student ${studentId}`
    );
    console.log(
      `Submission type: ${code ? "CODE" : "MCQ"}, selectedChoiceId: ${
        selectedChoiceId || "none"
      }`
    );

    // Get the problem to determine the type
    const problem = await prisma.problems.findUnique({
      where: { id: problemId },
      include: { choices: true },
    });

    if (!problem) {
      throw new Error("Problem not found");
    }

    console.log(
      `Problem found: ${problem.title}, type: ${problem.questionType}`
    );

    let score = 0;
    let status = "PENDING";
    let isCorrect = false;
    let testResults = null;

    // For multiple choice, compute the score immediately
    if (problem.questionType === "MULTIPLE_CHOICE" && selectedChoiceId) {
      const selectedChoice = problem.choices.find(
        (c) => c.id === selectedChoiceId
      );

      if (selectedChoice) {
        isCorrect = selectedChoice.isCorrect;
        status = isCorrect ? "COMPLETED" : "FAILED";
        score = isCorrect ? problem.score : 0;

        // Create test results for consistency with coding problems
        testResults = {
          passed: isCorrect ? 1 : 0,
          total: 1,
          results: [
            {
              testCaseId: "mcq",
              passed: isCorrect,
              expectedOutput:
                problem.choices.find((c) => c.isCorrect)?.text || "",
              actualOutput: selectedChoice.text,
              isHidden: false,
            },
          ],
        };

        console.log(
          `Selected choice: ${selectedChoice.text}, correct: ${isCorrect}, score: ${score}`
        );
      } else {
        console.error(
          `Selected choice ID ${selectedChoiceId} not found in problem choices`
        );
        throw new Error("Invalid choice selected");
      }
    }

    // Create a new submission
    const submission = await prisma.submission.create({
      data: {
        code,
        language,
        selectedChoiceId,
        status: status as any, // Type casting to handle status string
        score,
        studentId,
        problemId,
        testResults: testResults ? JSON.stringify(testResults) : null,
      },
    });

    console.log(
      `Submission created successfully: ID ${submission.id}, Score: ${submission.score}`
    );

    return {
      success: true,
      data: {
        ...submission,
        isCorrect,
        testResults,
      },
    };
  } catch (error) {
    console.error(
      "Error submitting solution:",
      error instanceof Error ? error.stack : error
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to submit solution",
    };
  }
}

// Function to update submission after evaluation
export async function updateSubmissionStatus(
  submissionId: string,
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "ERROR",
  score: number,
  executionTime?: number,
  memoryUsed?: number,
  errorMessage?: string,
  testResults?: any
) {
  try {
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status,
        score,
        executionTime,
        memoryUsed,
        errorMessage,
        testResults: testResults ? JSON.stringify(testResults) : undefined,
      },
    });

    return { success: true, data: updatedSubmission };
  } catch (error) {
    console.error("Error updating submission:", error.stack);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update submission",
    };
  }
}

// Function to calculate and save assessment performance statistics
export async function saveAssessmentStats(
  studentId: string,
  assessmentId: string
) {
  try {
    // Get all problem IDs for this assessment
    const assessment = await prisma.assessments.findUnique({
      where: { id: assessmentId },
      include: { problems: true },
    });

    if (!assessment) {
      return {
        success: false,
        error: "Assessment not found",
      };
    }

    // Get all submissions for this student and assessment
    const problemIds = assessment.problems.map((p) => p.id);
    const submissions = await prisma.submission.findMany({
      where: {
        studentId,
        problemId: { in: problemIds },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group submissions by problem to get the latest submission for each problem
    const latestSubmissionsByProblem = new Map<string, any>();

    for (const submission of submissions) {
      if (
        !latestSubmissionsByProblem.has(submission.problemId) ||
        new Date(submission.createdAt) >
          new Date(
            latestSubmissionsByProblem.get(submission.problemId).createdAt
          )
      ) {
        latestSubmissionsByProblem.set(submission.problemId, submission);
      }
    }

    // Calculate statistics
    const totalProblems = assessment.problems.length;
    const attemptedProblems = latestSubmissionsByProblem.size;
    const passedProblems = Array.from(
      latestSubmissionsByProblem.values()
    ).filter((s) => s.status === "COMPLETED").length;

    // Calculate total score
    let totalScore = 0;
    let maxPossibleScore = 0;

    assessment.problems.forEach((problem) => {
      maxPossibleScore += problem.score || 0;

      const submission = latestSubmissionsByProblem.get(problem.id);
      if (submission && submission.score) {
        totalScore += submission.score;
      }
    });

    // Calculate average execution time and memory usage (only applicable for coding problems)
    const execTimes = Array.from(latestSubmissionsByProblem.values())
      .map((s) => s.executionTime)
      .filter(Boolean);

    const avgExecTime =
      execTimes.length > 0
        ? execTimes.reduce((sum, time) => sum + time, 0) / execTimes.length
        : null;

    const memories = Array.from(latestSubmissionsByProblem.values())
      .map((s) => s.memoryUsed)
      .filter(Boolean);

    const avgMemory =
      memories.length > 0
        ? memories.reduce((sum, mem) => sum + mem, 0) / memories.length
        : null;

    // Get the attempt info
    const attempt = await prisma.attemptTracker.findUnique({
      where: {
        studentId_assessmentId: {
          studentId,
          assessmentId,
        },
      },
    });

    if (!attempt) {
      return {
        success: false,
        error: "No attempt record found",
      };
    }

    // Calculate time taken (in minutes)
    const startTime = new Date(attempt.startTime);
    const endTime = attempt.endTime ? new Date(attempt.endTime) : new Date();
    const timeTakenMs = endTime.getTime() - startTime.getTime();
    const timeTakenMinutes = Math.round(timeTakenMs / 60000);

    // Create or update assessment statistics
    // Check if the assessmentStats model exists in the schema
    // If not available in your schema, you'll need to create it
    try {
      // Attempt to use assessmentStats table if it exists
      const stats = await prisma.$transaction(async (tx) => {
        // Check if the table exists by querying for a record
        const existingStats = await tx.assessmentStats
          .findUnique({
            where: {
              studentId_assessmentId: {
                studentId,
                assessmentId,
              },
            },
          })
          .catch(() => null); // If table doesn't exist, return null

        if (existingStats !== null) {
          // Table exists, perform upsert
          return await tx.assessmentStats.upsert({
            where: {
              studentId_assessmentId: {
                studentId,
                assessmentId,
              },
            },
            update: {
              totalProblems,
              attemptedProblems,
              passedProblems,
              totalScore,
              maxPossibleScore,
              avgExecTime,
              avgMemory,
              timeTakenMinutes,
              completedAt: new Date(),
            },
            create: {
              studentId,
              assessmentId,
              totalProblems,
              attemptedProblems,
              passedProblems,
              totalScore,
              maxPossibleScore,
              avgExecTime,
              avgMemory,
              timeTakenMinutes,
              completedAt: new Date(),
            },
          });
        }

        // If table doesn't exist, return basic stats object
        return {
          studentId,
          assessmentId,
          totalProblems,
          attemptedProblems,
          passedProblems,
          totalScore,
          maxPossibleScore,
          timeTakenMinutes,
          completedAt: new Date(),
        };
      });

      return { success: true, data: stats };
    } catch (dbError) {
      console.error("Database error saving assessment stats:", dbError);

      // Return success anyway with the calculated stats
      return {
        success: true,
        data: {
          studentId,
          assessmentId,
          totalProblems,
          attemptedProblems,
          passedProblems,
          totalScore,
          maxPossibleScore,
          timeTakenMinutes,
        },
      };
    }
  } catch (error: unknown) {
    console.error("Error saving assessment stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save stats",
    };
  }
}

// Function to handle multiple edge cases when completing an assessment
export async function finalizeAssessment(
  studentId: string,
  assessmentId: string,
  isTimeExpired: boolean = false
) {
  console.log("Starting finalizeAssessment process...");
  console.log("Student ID:", studentId);
  console.log("Assessment ID:", assessmentId);
  console.log("Is time expired:", isTimeExpired);

  try {
    // Get the assessment information for total problems count and max score calculation
    const assessment = await prisma.assessments.findUnique({
      where: { id: assessmentId },
      include: {
        problems: true,
      },
    });

    if (!assessment) {
      throw new Error("Assessment not found");
    }

    // Get all submissions for this assessment
    console.log("Fetching submissions for assessment...");
    const submissions = await prisma.submission.findMany({
      where: {
        studentId,
        problem: {
          assessmentId,
        },
      },
      include: {
        problem: {
          select: {
            id: true,
            score: true,
            questionType: true,
          },
        },
      },
    });

    console.log("Found submissions:", submissions.length);

    // Calculate statistics
    const totalProblems = assessment.problems.length;
    const codingProblems = assessment.problems.filter(
      (p) => p.questionType === "CODING"
    ).length;
    const mcqProblems = assessment.problems.filter(
      (p) => p.questionType === "MULTIPLE_CHOICE"
    ).length;

    // Define counters for statistics
    let totalScore = 0;
    let codingScore = 0;
    let mcqScore = 0;
    let problemsCompleted = 0;
    let problemsAttempted = 0;

    // Maximum possible score from all problems
    const maxScore = assessment.problems.reduce(
      (sum, problem) => sum + (problem.score || 0),
      0
    );

    // Process submissions to calculate score and statistics
    submissions.forEach((submission) => {
      console.log(`Processing submission ${submission.id}:`, {
        score: submission.score,
        status: submission.status,
        problemId: submission.problemId,
        questionType: submission.problem.questionType,
      });

      // Count attempted problems - any submission counts as attempted
      problemsAttempted++;

      // Count completed problems - only COMPLETED, PASSED status or correct MCQ answers
      if (
        submission.status === "COMPLETED" ||
        submission.status === "PASSED" ||
        (submission.problem.questionType === "MULTIPLE_CHOICE" &&
          submission.isCorrect)
      ) {
        problemsCompleted++;
      }

      // Add to total score
      totalScore += submission.score || 0;

      // Add to category-specific scores
      if (submission.problem.questionType === "CODING") {
        codingScore += submission.score || 0;
      } else if (submission.problem.questionType === "MULTIPLE_CHOICE") {
        mcqScore += submission.score || 0;
      }
    });

    // Get the attempt tracker to calculate duration
    const attemptTracker = await prisma.attemptTracker.findUnique({
      where: {
        studentId_assessmentId: {
          studentId,
          assessmentId,
        },
      },
    });

    // Calculate duration in minutes
    let startTime: Date;
    let durationMinutes: number;

    if (attemptTracker) {
      console.log("Using attempt tracker for time calculation");
      startTime = new Date(attemptTracker.startTime);
      const endTime =
        isTimeExpired && attemptTracker.endTime
          ? new Date(attemptTracker.endTime)
          : new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      durationMinutes = Math.round(durationMs / (1000 * 60));
    } else {
      console.log("No attempt tracker found, using assessment duration");
      // If no attempt tracker, use the assessment's configured duration
      startTime = new Date();
      startTime.setMinutes(startTime.getMinutes() - assessment.duration);
      durationMinutes = assessment.duration;
    }

    console.log(`Calculated duration: ${durationMinutes} minutes`);

    // Calculate average time per problem for completed problems
    const averageTimePerProblem =
      problemsCompleted > 0 ? durationMinutes / problemsCompleted : null;

    // Create detailed submission data for analytics
    const submissionDetails = {
      totalSubmissions: submissions.length,
      totalProblems,
      codingProblems,
      mcqProblems,
      codingScore,
      mcqScore,
      totalScore,
      maxScore,
      problemsAttempted,
      problemsCompleted,
      submissionTimestamp: new Date().toISOString(),
      isTimeExpired,
      timeTaken: durationMinutes,
    };

    console.log("Calculated statistics:", submissionDetails);

    // Update attempt tracker or create one if it doesn't exist
    console.log("Updating attempt tracker...");
    let updatedAttempt;

    if (attemptTracker) {
      updatedAttempt = await prisma.attemptTracker.update({
        where: {
          studentId_assessmentId: {
            studentId,
            assessmentId,
          },
        },
        data: {
          isCompleted: true,
          endTime: new Date(),
        },
      });
      console.log("Existing attempt tracker updated");
    } else {
      // Create a new attempt tracker with retrospective start time
      updatedAttempt = await prisma.attemptTracker.create({
        data: {
          studentId,
          assessmentId,
          startTime: startTime,
          endTime: new Date(),
          isCompleted: true,
        },
      });
      console.log("New attempt tracker created retrospectively");
    }

    console.log("Attempt tracker updated:", updatedAttempt);

    // Update or create AssessmentSubmission record
    console.log("Updating assessment submission table...");
    const updatedSubmission = await prisma.assessmentSubmission.upsert({
      where: {
        studentId_assessmentId: {
          studentId,
          assessmentId,
        },
      },
      update: {
        totalScore,
        codingScore,
        mcqScore,
        maxScore,
        endTime: new Date(),
        duration: durationMinutes,
        status: isTimeExpired ? "TIMED_OUT" : "SUBMITTED",
        problemsAttempted,
        problemsCompleted,
        averageTimePerProblem,
        submissionDetails: submissionDetails as any,
        updatedAt: new Date(),
      },
      create: {
        studentId,
        assessmentId,
        totalScore,
        codingScore,
        mcqScore,
        maxScore,
        startTime: startTime,
        endTime: new Date(),
        duration: durationMinutes,
        status: isTimeExpired ? "TIMED_OUT" : "SUBMITTED",
        totalProblems,
        problemsAttempted,
        problemsCompleted,
        averageTimePerProblem,
        submissionDetails: submissionDetails as any,
      },
    });

    console.log(
      "Assessment submission updated with duration:",
      durationMinutes,
      "minutes"
    );

    console.log("Assessment finalized successfully");
    return {
      success: true,
      data: {
        totalScore,
        maxScore,
        codingScore,
        mcqScore,
        submissionCount: submissions.length,
        problemsAttempted,
        problemsCompleted,
        isCompleted: true,
      },
    };
  } catch (error) {
    console.error("Error in finalizeAssessment:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to finalize assessment",
    };
  }
}

/**
 * Fetch existing problems created by a professor
 * This will be used to allow reusing problems in new assessments
 */
export async function fetchProfessorProblems(professorId: string) {
  try {
    // Find professor by professorId instead of id
    const professor = await prisma.professor.findFirst({
      where: {
        OR: [{ id: professorId }, { professorId: professorId }],
      },
    });

    if (!professor) {
      throw new Error("Professor not found");
    }

    // Fetch all problems created by this professor using the professor's ID
    const problems = await prisma.problems.findMany({
      where: { professorId: professor.id },
      include: {
        testCases: true,
        languages: true,
        choices: true, // Include choices for multiple choice questions
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Return the database objects directly - we'll transform them in the component
    return problems;
  } catch (error) {
    console.error("Error fetching professor problems:", error);
    throw new Error("Failed to fetch problems");
  }
}
