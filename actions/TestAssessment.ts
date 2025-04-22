"use server";
import prisma from "@/lib/db";
import { AssessmentStatus } from "@prisma/client";

export async function fetchAssessmentById(
  assessmentId: string,
  batch: string,
  department: string
) {
  try {
    console.log(
      `Fetching assessment ${assessmentId} for batch ${batch}, department ${department}`
    );

    const currentDate = new Date();

    const assessment = await prisma.assessments.findFirst({
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
            id: assessmentId,
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
            languages: true,
            choices: true, // Include choices for MCQ problems
          },
        },
      },
    });

    if (assessment) {
      console.log(`Found assessment: ${assessment.title}`);
      console.log(`Total problems: ${assessment.problems.length}`);

      // Log details about MCQ problems and their choices
      const mcqProblems = assessment.problems.filter(
        (p) => p.questionType === "MULTIPLE_CHOICE"
      );
      console.log(`MCQ problems: ${mcqProblems.length}`);

      mcqProblems.forEach((problem, index) => {
        console.log(
          `MCQ #${index + 1}: ${problem.title}, Choices: ${
            problem.choices?.length || 0
          }`
        );
        problem.choices?.forEach((choice) => {
          console.log(
            `  - Choice ${choice.id}: ${choice.text} (${
              choice.isCorrect ? "correct" : "incorrect"
            })`
          );
        });
      });

      return {
        id: assessment.id,
        title: assessment.title,
        batch: assessment.batch,
        departments: assessment.departments,
        startTime: assessment.startTime.toISOString(),
        endTime: assessment.endTime.toISOString(),
        duration: assessment.duration,
        totalQuestions: assessment.totalQuestions,
        problems: assessment.problems,
        topics: assessment.topics,
        status: assessment.status,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching assessments by Id:", error);
    throw new Error("Failed to fetch assessments by Id");
  }
}

export async function fetchAssessmentCompleted(
  assessmentId: string,
  batch: string,
  department: string
) {
  try {
    console.log(
      `Fetching assessment ${assessmentId} for batch ${batch}, department ${department}`
    );

    const assessment = await prisma.assessments.findFirst({
      where: {
        AND: [
          {
            batch: {
              has: batch,
            },
            departments: {
              has: department,
            },
            id: assessmentId,
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
            languages: true,
            choices: true, // Include choices for MCQ problems
          },
        },
      },
    });

    if (assessment) {
      console.log(`Found assessment: ${assessment.title}`);
      console.log(`Total problems: ${assessment.problems.length}`);

      // Log details about MCQ problems and their choices
      const mcqProblems = assessment.problems.filter(
        (p) => p.questionType === "MULTIPLE_CHOICE"
      );
      console.log(`MCQ problems: ${mcqProblems.length}`);

      mcqProblems.forEach((problem, index) => {
        console.log(
          `MCQ #${index + 1}: ${problem.title}, Choices: ${
            problem.choices?.length || 0
          }`
        );
        problem.choices?.forEach((choice) => {
          console.log(
            `  - Choice ${choice.id}: ${choice.text} (${
              choice.isCorrect ? "correct" : "incorrect"
            })`
          );
        });
      });

      return {
        id: assessment.id,
        title: assessment.title,
        batch: assessment.batch,
        departments: assessment.departments,
        startTime: assessment.startTime.toISOString(),
        endTime: assessment.endTime.toISOString(),
        duration: assessment.duration,
        totalQuestions: assessment.totalQuestions,
        problems: assessment.problems,
        topics: assessment.topics,
        status: assessment.status,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching assessments by Id:", error);
    throw new Error("Failed to fetch assessments by Id");
  }
}
