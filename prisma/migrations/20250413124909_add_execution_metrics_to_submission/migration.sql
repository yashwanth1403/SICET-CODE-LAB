-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "executionTime" INTEGER,
ADD COLUMN     "memoryUsed" INTEGER,
ADD COLUMN     "testResults" JSONB;
