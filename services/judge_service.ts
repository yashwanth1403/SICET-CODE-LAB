"use server";

import axios, { AxiosError } from "axios";
import { Status } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { LANGUAGE_IDS, STATUS_CODES } from "@/utils/contants";

// Configure your Judge0 self-hosted instance URL
const JUDGE0_API_URL = process.env.NEXT_PUBLIC_JUDGE0_API_URL;

interface JudgeSubmissionResult {
  status: {
    id: number;
    description: string;
  };
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time: string;
  memory: number;
  // Add decoded properties that we add to the result
  decoded_stdout?: string;
  decoded_stderr?: string;
  decoded_compile_output?: string;
  decoded_message?: string;
}

// Define result types for clarity
interface CodeExecutionResult {
  status: "success" | "error";
  statusDescription: string;
  dbStatus: Status;
  output: string | null;
  error: string | null;
  executionTime: number | null;
  memory: number | null;
}

interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
  error: string | null;
  passed: boolean;
  statusDescription: string;
  executionTime: number | null;
  memory: number | null;
}

interface TestCasesResult {
  passed: number;
  total: number;
  cases: TestCaseResult[];
  status: Status;
}

interface SubmissionActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Map Judge0 status to our database Status enum
export const mapJudgeStatusToDbStatus = async (
  judgeStatusId: number
): Promise<Status> => {
  switch (judgeStatusId) {
    case 1: // In Queue
    case 2: // Processing
      return Status.RUNNING;
    case 3: // Accepted
      return Status.COMPLETED;
    case 4: // Wrong Answer
      return Status.FAILED;
    case 5: // Time Limit Exceeded
    case 6: // Compilation Error
    case 7: // Runtime Error (SIGSEGV)
    case 8: // Runtime Error (SIGXFSZ)
    case 9: // Runtime Error (SIGFPE)
    case 10: // Runtime Error (SIGABRT)
    case 11: // Runtime Error (NZEC)
    case 12: // Runtime Error (Other)
      return Status.ERROR;
    case 13: // Internal Error
    case 14: // Exec Format Error
    default:
      return Status.ERROR;
  }
};

// Create a submission
export async function createSubmission(
  code: string,
  languageName: string,
  input?: string,
  expectedOutput?: string
): Promise<string> {
  try {
    const languageId = LANGUAGE_IDS[languageName as keyof typeof LANGUAGE_IDS];
    if (!languageId) {
      throw new Error(`Unsupported language: ${languageName}`);
    }

    console.log("Code:", code);
    console.log("Original input:", input);

    // Check if code starts with a caret and remove it if needed
    const cleanedCode = code.startsWith("^") ? code.substring(1) : code;

    // Process input - handle special cases
    let processedInput = null;
    if (input) {
      // Check if this is a string with quotes that needs to preserve spaces
      if (input.trim().startsWith('"') && input.trim().endsWith('"')) {
        // This is likely a string that needs to preserve spaces
        // Remove only outer quotes and escaped quotes, keep internal spaces
        processedInput = input.trim();

        // Remove outer quotes if they exist
        if (processedInput.startsWith('"') && processedInput.endsWith('"')) {
          processedInput = processedInput.slice(1, -1);
        }

        // Remove escaped quotes
        processedInput = processedInput.replace(/\\"/g, "");

        console.log(
          "Processed string input (spaces preserved):",
          processedInput
        );
      } else {
        // For non-string inputs, we can still remove whitespace
        processedInput = input.replace(/\s+/g, "");
        console.log(
          "Processed numeric input (whitespace removed):",
          processedInput
        );
      }
    }

    // Create submission data exactly matching the format from the sample
    const submissionData = JSON.stringify({
      source_code: cleanedCode,
      language_id: languageId.toString(),
      number_of_runs: null,
      stdin: processedInput,
      expected_output: expectedOutput || null,
      cpu_time_limit: null,
      cpu_extra_time: null,
      wall_time_limit: null,
      memory_limit: null,
      stack_limit: null,
      max_processes_and_or_threads: null,
      enable_per_process_and_thread_time_limit: null,
      enable_per_process_and_thread_memory_limit: null,
      max_file_size: null,
      enable_network: null,
    });

    // Axios configuration matching the sample exactly
    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: JUDGE0_API_URL,
      headers: {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Connection: "keep-alive",
        "Content-Type": "application/json",
        Origin: "http://64.227.187.93:2358",
        Referer: "http://64.227.187.93:2358/dummy-client.html",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
      },
      data: submissionData,
    };

    console.log("Request config:", config);

    const response = await axios(config);
    console.log("Response data:", response.data);

    return response.data.token;
  } catch (error: unknown) {
    console.error("Error creating submission:", error);
    // Print out more detailed error information
    if (error instanceof AxiosError && error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      console.error("Response headers:", error.response.headers);
    }
    throw error;
  }
}

// Check submission status
export async function getSubmissionResult(
  token: string
): Promise<JudgeSubmissionResult> {
  try {
    if (!token) throw new Error("Invalid submission token.");
    console.log("Fetching result for token:", token);

    // Fix: Ensure we don't duplicate "submissions" in the URL
    const url = `${JUDGE0_API_URL}/${token}?base64_encoded=true`;

    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url,
      headers: {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Connection: "keep-alive",
        Referer: "http://64.227.187.93:2358/dummy-client.html",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
      },
    };

    console.log("Get result config:", config);
    const response = await axios.request(config);
    console.log("Get result response:", response.data);

    // Decode base64 fields if they exist
    const decodedResult = { ...response.data };

    if (decodedResult.stdout && decodedResult.stdout.trim()) {
      decodedResult.decoded_stdout = Buffer.from(
        decodedResult.stdout,
        "base64"
      ).toString("utf-8");
    }

    if (decodedResult.stderr && decodedResult.stderr.trim()) {
      decodedResult.decoded_stderr = Buffer.from(
        decodedResult.stderr,
        "base64"
      ).toString("utf-8");
    }

    if (decodedResult.compile_output && decodedResult.compile_output.trim()) {
      decodedResult.decoded_compile_output = Buffer.from(
        decodedResult.compile_output,
        "base64"
      ).toString("utf-8");
    }

    if (decodedResult.message && decodedResult.message.trim()) {
      decodedResult.decoded_message = Buffer.from(
        decodedResult.message,
        "base64"
      ).toString("utf-8");
    }
    console.log("Decoded result:", decodedResult);

    return decodedResult;
  } catch (error: unknown) {
    console.error("Error getting submission result:", error);
    // Add more detailed error logging
    if (error instanceof AxiosError && error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      console.error("Response headers:", error.response.headers);
    }
    throw error;
  }
}
// Run code with custom input (without checking against expected output)
export async function runCode(
  code: string,
  languageName: string,
  input?: string
): Promise<CodeExecutionResult> {
  try {
    const token = await createSubmission(code, languageName, input);

    // Poll for results
    let result: JudgeSubmissionResult | null = null;
    let attempts = 0;
    const maxAttempts = 10; // Maximum polling attempts
    console.log("token", token);

    while (!result && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

      const submissionResult = await getSubmissionResult(token);

      // Check if processing is complete
      if (submissionResult.status.id >= 3) {
        result = submissionResult;
      }

      attempts++;
    }

    if (!result) {
      throw new Error("Execution timed out");
    }

    // Map Judge0 status to database status
    const status = await mapJudgeStatusToDbStatus(result.status.id);

    // Decode outputs if they exist and are base64 encoded
    let decodedStdout = null;
    let decodedStderr = null;
    let decodedCompileOutput = null;

    if (result.stdout && result.stdout.trim()) {
      decodedStdout = Buffer.from(result.stdout, "base64").toString("utf-8");
    }

    if (result.stderr && result.stderr.trim()) {
      decodedStderr = Buffer.from(result.stderr, "base64").toString("utf-8");
    }

    if (result.compile_output && result.compile_output.trim()) {
      decodedCompileOutput = Buffer.from(
        result.compile_output,
        "base64"
      ).toString("utf-8");
    }

    // Format the response
    return {
      status: result.status.id === 3 ? "success" : "error",
      statusDescription:
        STATUS_CODES[result.status.id as keyof typeof STATUS_CODES] ||
        "Unknown",
      dbStatus: status,
      output: decodedCompileOutput || decodedStdout || null,
      error: decodedStderr || decodedCompileOutput || null,
      executionTime: parseFloat(result.time),
      memory: result.memory,
    };
  } catch (error: unknown) {
    console.error("Error running code:", error);
    return {
      status: "error",
      statusDescription: "Execution Error",
      dbStatus: Status.ERROR,
      output: null,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred during execution",
      executionTime: null,
      memory: null,
    };
  }
}

// Run test cases and check against expected output
export async function runTestCases(
  code: string,
  languageName: string,
  testCases: { input: string; output: string }[]
): Promise<TestCasesResult> {
  try {
    // Run each test case
    const results = await Promise.all(
      testCases.map(async (testCase) => {
        const token = await createSubmission(
          code,
          languageName,
          testCase.input,
          testCase.output
        );

        // Poll for results
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const result = await getSubmissionResult(token);

          // Check if processing is complete
          if (result.status.id >= 3) {
            const passed = result.status.id === 3;

            // Decode outputs if they exist and are base64 encoded
            let decodedStdout = null;
            let decodedStderr = null;
            let decodedCompileOutput = null;

            if (result.stdout && result.stdout.trim()) {
              decodedStdout = Buffer.from(result.stdout, "base64").toString(
                "utf-8"
              );
            }

            if (result.stderr && result.stderr.trim()) {
              decodedStderr = Buffer.from(result.stderr, "base64").toString(
                "utf-8"
              );
            }

            if (result.compile_output && result.compile_output.trim()) {
              decodedCompileOutput = Buffer.from(
                result.compile_output,
                "base64"
              ).toString("utf-8");
            }

            return {
              input: testCase.input,
              expectedOutput: testCase.output,
              actualOutput: decodedStdout || null,
              error: decodedStderr || decodedCompileOutput || null,
              passed,
              statusDescription:
                STATUS_CODES[result.status.id as keyof typeof STATUS_CODES] ||
                "Unknown",
              executionTime: parseFloat(result.time),
              memory: result.memory,
            };
          }

          attempts++;
        }

        return {
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: null,
          error: "Execution timed out",
          passed: false,
          statusDescription: "Timeout",
          executionTime: null,
          memory: null,
        };
      })
    );

    // Calculate summary and determine overall status
    const passed = results.filter((r) => r.passed).length;
    const totalTests = testCases.length;

    // If all tests pass, status is COMPLETED
    // If some pass, status is FAILED
    // If none pass, status is ERROR
    let overallStatus: Status;
    if (passed === totalTests) {
      overallStatus = Status.COMPLETED;
    } else if (passed > 0) {
      overallStatus = Status.FAILED;
    } else {
      overallStatus = Status.ERROR;
    }

    return {
      passed,
      total: totalTests,
      cases: results,
      status: overallStatus,
    };
  } catch (error: unknown) {
    console.error("Error running test cases:", error);
    return {
      passed: 0,
      total: testCases.length,
      cases: testCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.output,
        actualOutput: null,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while running tests",
        passed: false,
        statusDescription: "Error",
        executionTime: null,
        memory: null,
      })),
      status: Status.ERROR,
    };
  }
}

// Server action to save submission (simplified example)
export async function saveSubmissionAction(
  data: unknown
): Promise<SubmissionActionResult> {
  try {
    // This would typically call your database service
    // Mocking it here for simplicity
    console.log("Saving submission to database:", data);

    // Revalidate the path to ensure UI gets fresh data
    if (typeof data === "object" && data !== null && "assessmentId" in data) {
      const assessmentId = (data as { assessmentId: string }).assessmentId;
      revalidatePath(`/assessment/ongoing/${assessmentId}`);
    }

    return { success: true, data };
  } catch (error: unknown) {
    console.error("Error saving submission:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
