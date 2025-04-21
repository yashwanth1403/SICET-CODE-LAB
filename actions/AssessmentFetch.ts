"use server";
import prisma from "@/lib/db";
import { AssessmentStatus } from "@prisma/client";

interface Assessment {
  id: string;
  title: string;
  batch: string[];
  departments: string[];
  startTime: string;
  endTime: string;
  duration: number;
  totalQuestions: number;
  topics: string[];
  status: AssessmentStatus;
}

export async function fetchAssessments(): Promise<Assessment[]> {
  try {
    const currentDate = new Date();

    const assessments = await prisma.assessments.findMany({
      where: {
        startTime: {
          gt: currentDate,
        },
      },
      include: {
        problems: {
          include: {
            testCases: true,
            choices: true,
            languages: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return assessments.map((assessment) => ({
      id: assessment.id,
      title: assessment.title,
      batch: assessment.batch,
      departments: assessment.departments,
      startTime: assessment.startTime.toISOString(),
      endTime: assessment.endTime.toISOString(),
      duration: assessment.duration,
      totalQuestions: assessment.totalQuestions,
      topics: assessment.topics,
      status: assessment.status,
    }));
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}

export async function deleteAllAssessments() {
  try {
    // Use transaction to ensure all related data is deleted
    await prisma.$transaction(async (tx) => {
      // Delete all test cases first
      await tx.testCases.deleteMany({});

      // Delete all problems
      await tx.problems.deleteMany({});

      // Finally delete all assessments
      await tx.assessments.deleteMany({});
    });

    return {
      success: true,
      message: "All assessments deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting assessments:", error);
    return {
      success: false,
      message: "Failed to delete assessments",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function UpcomingAssessments(batch: string, department: string) {
  try {
    const currentDate = new Date();

    const assessments = await prisma.assessments.findMany({
      where: {
        startTime: {
          gt: currentDate,
        },
        batch: {
          has: batch,
        },
        departments: {
          has: department,
        },
      },
      include: {
        problems: {
          include: {
            testCases: true,
            choices: true,
            languages: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return assessments.map((assessment) => ({
      id: assessment.id,
      title: assessment.title,
      batch: assessment.batch,
      departments: assessment.departments,
      startTime: assessment.startTime.toISOString(),
      endTime: assessment.endTime.toISOString(),
      duration: assessment.duration,
      totalQuestions: assessment.totalQuestions,
      topics: assessment.topics,
      status: assessment.status,
    }));
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}

export async function OngoingAssessments(batch: string, department: string) {
  try {
    const currentDate = new Date();
    console.log(batch, department);

    const assessments = await prisma.assessments.findMany({
      where: {
        AND: [
          {
            startTime: {
              lte: currentDate, // Started before or at current time
            },
            endTime: {
              gt: currentDate, // Ends after current time
            },
          },
          {
            batch: {
              has: batch,
            },
            departments: {
              has: department,
            },
          },
          {
            status: AssessmentStatus.DRAFT,
          },
        ],
      },
      include: {
        problems: {
          include: {
            testCases: true,
            choices: true,
            languages: true,
          },
        },
      },
      orderBy: {
        endTime: "asc", // Order by end time so closest to ending comes first
      },
    });

    return assessments.map((assessment) => ({
      id: assessment.id,
      title: assessment.title,
      batch: assessment.batch,
      departments: assessment.departments,
      startTime: assessment.startTime.toISOString(),
      endTime: assessment.endTime.toISOString(),
      duration: assessment.duration,
      totalQuestions: assessment.totalQuestions,
      topics: assessment.topics,
      status: assessment.status,
      problems: assessment.problems,
    }));
  } catch (error) {
    console.error("Error fetching ongoing assessments:", error);
    throw new Error("Failed to fetch ongoing assessments");
  }
}

export async function fetchProfessorAssessmentSubmissions(
  professorId: string,
  filters?: {
    department?: string;
    batch?: string;
    studentId?: string;
    assessmentId?: string;
    orderBy?: "score" | "date";
    orderDirection?: "asc" | "desc";
  }
) {
  try {
    // First get all assessments created by this professor
    const where: Record<string, any> = { professorId };

    if (filters?.assessmentId) {
      where.id = filters.assessmentId;
    }

    const assessments = await prisma.assessments.findMany({
      where,
      select: {
        id: true,
        title: true,
        batch: true,
        departments: true,
        startTime: true,
        endTime: true,
        totalQuestions: true,
      },
    });

    const assessmentIds = assessments.map((assessment) => assessment.id);

    // Then get all submissions for these assessments
    const submissionsWhere: Record<string, any> = {
      assessmentId: { in: assessmentIds },
    };

    // Apply filters if provided
    if (filters?.department || filters?.batch || filters?.studentId) {
      // Include student information to filter by department or batch
      const studentWhere: Record<string, any> = {};

      if (filters.department) {
        studentWhere.department = filters.department;
      }

      if (filters.batch) {
        studentWhere.batch = filters.batch;
      }

      if (filters.studentId) {
        studentWhere.studentId = filters.studentId;
      }

      submissionsWhere.student = studentWhere;
    }

    // Determine order parameters
    const orderBy: Record<string, any> = {};

    if (filters?.orderBy === "score") {
      orderBy.totalScore = filters.orderDirection || "desc";
    } else {
      // Default to ordering by date
      orderBy.updatedAt = filters?.orderDirection || "desc";
    }

    const submissions = await prisma.assessmentSubmission.findMany({
      where: submissionsWhere,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            department: true,
            batch: true,
          },
        },
        assessment: {
          select: {
            id: true,
            title: true,
            totalQuestions: true,
            batch: true,
            departments: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy,
    });

    // Group submissions by assessment with proper date string conversion
    const submissionsByAssessment = assessments.map((assessment) => {
      const filteredSubmissions = submissions.filter(
        (submission) => submission.assessmentId === assessment.id
      );

      return {
        assessment: {
          ...assessment,
          startTime: assessment.startTime.toISOString(),
          endTime: assessment.endTime.toISOString(),
        },
        submissions: filteredSubmissions.map((submission) => ({
          ...submission,
          startTime: submission.startTime?.toISOString() || null,
          endTime: submission.endTime?.toISOString() || null,
          assessment: {
            ...submission.assessment,
            startTime: submission.assessment.startTime.toISOString(),
            endTime: submission.assessment.endTime.toISOString(),
          },
        })),
        topScorer:
          filteredSubmissions.length > 0
            ? {
                ...filteredSubmissions.reduce((prev, current) =>
                  prev.totalScore > current.totalScore ? prev : current
                ),
                startTime:
                  filteredSubmissions
                    .reduce((prev, current) =>
                      prev.totalScore > current.totalScore ? prev : current
                    )
                    .startTime?.toISOString() || null,
                endTime:
                  filteredSubmissions
                    .reduce((prev, current) =>
                      prev.totalScore > current.totalScore ? prev : current
                    )
                    .endTime?.toISOString() || null,
                assessment: {
                  ...filteredSubmissions.reduce((prev, current) =>
                    prev.totalScore > current.totalScore ? prev : current
                  ).assessment,
                  startTime: filteredSubmissions
                    .reduce((prev, current) =>
                      prev.totalScore > current.totalScore ? prev : current
                    )
                    .assessment.startTime.toISOString(),
                  endTime: filteredSubmissions
                    .reduce((prev, current) =>
                      prev.totalScore > current.totalScore ? prev : current
                    )
                    .assessment.endTime.toISOString(),
                },
              }
            : null,
        averageScore:
          filteredSubmissions.length > 0
            ? filteredSubmissions.reduce(
                (sum, sub) => sum + sub.totalScore,
                0
              ) / filteredSubmissions.length
            : 0,
      };
    });

    return submissionsByAssessment;
  } catch (error) {
    console.error("Error fetching professor assessment submissions:", error);
    throw new Error("Failed to fetch assessment submissions");
  }
}
