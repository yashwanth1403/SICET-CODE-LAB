"use server";

import prisma from "@/lib/db";
import { DifficultyLevel, AssessmentStatus } from "@prisma/client";

interface TestCase {
  input: string;
  output: string;
  score: number;
  isHidden: boolean;
}

interface Problem {
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  testCases: TestCase[];
}

interface CreateAssessmentParams {
  title: string;
  batch: string;
  departments: string[];
  startTime: string;
  endTime: string;
  duration: number;
  totalQuestions: number;
  topics: string[];
  problems: Problem[];
  professorId: string;
}

export async function createAssessmentHandler(params: CreateAssessmentParams) {
  try {
    // Validate environment
    if (typeof window !== "undefined") {
      throw new Error("This action can only be run on the server");
    }

    console.log("params", params);

    // Validate required parameters
    if (!params.professorId) {
      throw new Error("Professor ID is required");
    }

    // Log the connection URL (sensitive information will be masked)
    console.log(
      "Database URL:",
      process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace(/:[^@]+@/, ":****@")
        : "No DATABASE_URL found"
    );

    // Create assessment first
    const newAssessment = await prisma.assessments.create({
      data: {
        title: params.title,
        batch: params.batch,
        departments: params.departments,
        startTime: new Date(params.startTime),
        endTime: new Date(params.endTime),
        duration: params.duration,
        totalQuestions: params.totalQuestions,
        topics: params.topics,
        status: AssessmentStatus.DRAFT,
        professorId: params.professorId,
      },
    });

    // Create problems with test cases
    const problemCreationPromises = params.problems.map((problem) =>
      prisma.problems.create({
        data: {
          title: problem.title,
          description: problem.description,
          difficulty: problem.difficulty,
          assessmentId: newAssessment.id,
          professorId: params.professorId,
          testCases: {
            create: problem.testCases.map((tc) => ({
              input: tc.input,
              output: tc.output,
              score: tc.score,
              isHidden: tc.isHidden,
            })),
          },
        },
      })
    );

    // Wait for all problem creations to complete
    await Promise.all(problemCreationPromises);

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
}
