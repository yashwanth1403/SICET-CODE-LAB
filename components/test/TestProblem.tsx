// app/components/TestProblem.tsx
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAtom } from "jotai";
import {
  createProblemAtom,
  createProblemSubmissionAtom,
} from "@/lib/store/atom/testAssessment";
import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { autocompletion, CompletionContext } from "@codemirror/autocomplete";
import { indentUnit } from "@codemirror/language";
import { Compartment } from "@codemirror/state";
import { useRouter } from "next/navigation";
import { runCode, runTestCases } from "@/services/judge_service";
import { saveSubmission, calculateScore } from "@/services/submissionService";
import { getLanguageSuggestions } from "@/utils/contants";
import { toast } from "react-hot-toast";
import { Status } from "@prisma/client";

const TestProblem = ({
  problemId,
  assessmentId,
  studentId,
}: {
  problemId: string;
  assessmentId: string;
  studentId: string;
}) => {
  const router = useRouter();
  const problemAtom = useMemo(() => createProblemAtom(problemId), [problemId]);
  const problemSubmissionAtom = useMemo(
    () => createProblemSubmissionAtom(problemId),
    [problemId]
  );

  const [problem] = useAtom(problemAtom);
  const [submission, setSubmission] = useAtom(problemSubmissionAtom);

  const [activeTab, setActiveTab] = useState("description");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [code, setCode] = useState("");
  const [testResults, setTestResults] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState("testcase");
  const [customInput, setCustomInput] = useState("");
  const [isUsingCustomInput, setIsUsingCustomInput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSetupDone, setInitialSetupDone] = useState(false);

  const editorRef = useRef(null);
  const editorViewRef = useRef(null);
  const customInputRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // Language configuration
  const languageConf = useMemo(() => new Compartment(), []);

  // State for showing the copy warning
  const [showCopyWarning, setShowCopyWarning] = useState(false);
  const copyWarningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State for tab switching detection
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const tabWarningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add state for UI layout control
  const [isDescriptionCollapsed, setIsDescriptionCollapsed] = useState(false);
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(true);

  // Setup visibility change detection
  useEffect(() => {
    // Handler for visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // User switched tabs or minimized the window
        setTabSwitchCount((prev) => prev + 1);
        setShowTabWarning(true);

        // Log the event
        console.log(`Tab switch detected. Total count: ${tabSwitchCount + 1}`);
      }
    };

    // Add event listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (tabWarningTimeoutRef.current) {
        clearTimeout(tabWarningTimeoutRef.current);
      }
    };
  }, [tabSwitchCount]);

  // Prevent page refresh or closing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Cancel the event and show confirmation dialog
      e.preventDefault();
      // Chrome requires returnValue to be set
      e.returnValue = "";

      // Log attempt
      console.log("Page close/refresh attempt detected");

      // Return a message that will be displayed in the confirmation dialog
      return "Changes you made may not be saved. Are you sure you want to leave the test?";
    };

    // Add event listener
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Block tab-switching keyboard shortcuts
  useEffect(() => {
    const blockTabSwitchingShortcuts = (e: KeyboardEvent) => {
      // Block Alt+Tab (doesn't fully work due to browser restrictions)
      if (e.altKey && e.key === "Tab") {
        e.preventDefault();
        setShowTabWarning(true);
        setTabSwitchCount((prev) => prev + 1);
        console.log("Alt+Tab blocked");
      }

      // Block Ctrl+T (new tab)
      if ((e.ctrlKey || e.metaKey) && e.key === "t") {
        e.preventDefault();
        console.log("Ctrl+T (new tab) blocked");
      }

      // Block Ctrl+N (new window)
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        console.log("Ctrl+N (new window) blocked");
      }

      // Block Ctrl+W (close tab)
      if ((e.ctrlKey || e.metaKey) && e.key === "w") {
        e.preventDefault();
        console.log("Ctrl+W (close tab) blocked");
      }

      // Block F5 (refresh)
      if (e.key === "F5") {
        e.preventDefault();
        console.log("F5 (refresh) blocked");
      }
    };

    // Add event listener
    window.addEventListener("keydown", blockTabSwitchingShortcuts);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", blockTabSwitchingShortcuts);
    };
  }, []);

  // Get function signature and wrapper code for the selected language
  const getFunctionWrapper = useCallback(() => {
    if (!problem || !problem.languages)
      return { signature: "", prefix: "", suffix: "" };

    const languageTemplate = problem.languages.find(
      (lang) => lang.name === selectedLanguage
    );

    if (!languageTemplate) return { signature: "", prefix: "", suffix: "" };

    // Extract just the function signature and wrapper code
    return {
      signature: languageTemplate.functionSignature || "",
      prefix: languageTemplate.codePrefix || "",
      suffix: languageTemplate.codeSuffix || "",
    };
  }, [problem, selectedLanguage]);

  // Get starter code for the selected language (only the function body)
  const getStarterCode = useCallback(() => {
    if (!problem || !problem.languages) return "";

    const languageTemplate = problem.languages.find(
      (lang) => lang.name === selectedLanguage
    );

    // Only return the function body, not the entire template
    return languageTemplate
      ? languageTemplate.starterCode
          .replace(languageTemplate.codePrefix || "", "")
          .replace(languageTemplate.codeSuffix || "", "")
          .trim()
      : "";
  }, [problem, selectedLanguage]);

  // Prepare full code by combining user's function with wrapper code
  const getFullCode = useCallback(() => {
    const { prefix, suffix } = getFunctionWrapper();
    return `${prefix}\n${code}\n${suffix}`;
  }, [code, getFunctionWrapper]);

  // Check if problem is null and redirect if necessary
  useEffect(() => {
    if (problem === null) {
      router.push(`/assessment/ongoing/${assessmentId}`);
    }
  }, [problem, assessmentId, router]);

  // Load previously saved submission from localStorage on initial load
  useEffect(() => {
    if (!problem || initialSetupDone) return;

    const loadSavedSubmission = () => {
      try {
        const storageKey = `assessment_code_${assessmentId}_${problemId}`;
        const savedData = localStorage.getItem(storageKey);

        if (savedData) {
          const parsedSubmission = JSON.parse(savedData);

          // If we have a saved language, use it
          if (parsedSubmission.language) {
            setSelectedLanguage(parsedSubmission.language);
          } else if (problem?.languages && problem.languages.length > 0) {
            // Otherwise use the first available language
            setSelectedLanguage(problem.languages[0].name);
          }

          // Set the code from saved submission (just the function body)
          if (parsedSubmission.code) {
            setCode(parsedSubmission.code);
          }

          // Update the atom with saved submission
          setSubmission(parsedSubmission);
        } else if (problem?.languages && problem.languages.length > 0) {
          // No saved submission, use default language
          setSelectedLanguage(problem.languages[0].name);

          // Set the starter code for the selected language
          const starterCode = getStarterCode();
          if (starterCode) {
            setCode(starterCode);
          }
        }
      } catch (error) {
        console.error("Error loading saved submission:", error);

        // Fall back to defaults
        if (problem?.languages && problem.languages.length > 0) {
          setSelectedLanguage(problem.languages[0].name);

          // Set the starter code for the selected language
          const starterCode = getStarterCode();
          if (starterCode) {
            setCode(starterCode);
          }
        }
      }

      setInitialSetupDone(true);
    };

    loadSavedSubmission();
  }, [
    problem,
    assessmentId,
    problemId,
    setSubmission,
    initialSetupDone,
    getStarterCode,
  ]);

  // Setup autosave functionality
  useEffect(() => {
    // Don't set up autosave until initial setup is done
    if (!initialSetupDone) return;

    const autoSaveCode = () => {
      if (!problemId || !assessmentId || !selectedLanguage || !code) return;

      const newSubmission = {
        code,
        language: selectedLanguage,
        lastSaved: new Date().toISOString(),
        results: submission?.results,
      };

      // Update the atom with the new submission
      setSubmission(newSubmission);

      // Save to localStorage
      const storageKey = `assessment_code_${assessmentId}_${problemId}`;
      localStorage.setItem(storageKey, JSON.stringify(newSubmission));

      // Show toast notification for autosave
      toast.success("Code autosaved", {
        duration: 2000,
        position: "bottom-right",
        style: {
          background: "#1F2937",
          color: "#9CA3AF",
          fontSize: "14px",
          borderRadius: "6px",
          padding: "16px",
        },
        icon: "💾",
      });
    };

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    // Set up new timer (30 seconds)
    autoSaveTimerRef.current = setInterval(autoSaveCode, 30000);

    // Clean up timer on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [
    problemId,
    assessmentId,
    selectedLanguage,
    code,
    setSubmission,
    submission,
    initialSetupDone,
  ]);

  // Get language-specific indentation settings
  const getIndentationSettings = (language: string) => {
    switch (language) {
      case "Python":
        return indentUnit.of("    "); // 4 spaces for Python
      case "JavaScript":
      case "Java":
      case "C++":
      case "C":
      default:
        return indentUnit.of("  "); // 2 spaces for other languages
    }
  };

  // Get language extension
  const getLanguageExtension = (language: string) => {
    switch (language) {
      case "C":
        return cpp(); // C and C++ share similar syntax, so we can use cpp() for C
      case "C++":
        return cpp();
      case "Java":
        return java();
      case "Python":
        return python();
      case "JavaScript":
        return javascript();
      default:
        return javascript();
    }
  };

  // Set up the editor once language and code are ready
  useEffect(() => {
    if (!editorRef.current || !selectedLanguage || !initialSetupDone) return;

    if (editorViewRef.current) {
      editorViewRef.current.destroy();
    }

    // Create custom autocompletion source for language-specific suggestions
    const customCompletions = (context: CompletionContext) => {
      const suggestions = getLanguageSuggestions(selectedLanguage);

      // Don't show suggestions if not at valid position
      const word = context.matchBefore(/\w*/);
      if (!word || (word.from === word.to && !context.explicit)) return null;

      return {
        from: word.from,
        options: suggestions.map((suggestion) => ({
          label: suggestion.label,
          type: suggestion.type,
          info: suggestion.info,
        })),
      };
    };

    // Use saved code or starter code
    const initialCode = code || getStarterCode();

    const startState = EditorState.create({
      doc: initialCode,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        getLanguageExtension(selectedLanguage),
        dracula,
        // Add language-specific indentation
        getIndentationSettings(selectedLanguage),
        // Add custom autocompletion
        autocompletion({
          override: [customCompletions],
          defaultKeymap: true,
          icons: true,
          aboveCursor: true,
        }),
        // Add compartment for language-specific config
        languageConf.of([]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            // IMPORTANT: We use a callback form of setState to prevent React state updates
            // from interfering with the cursor position
            setCode((prevCode) => {
              const newCode = update.state.doc.toString();
              // Only update if the code has actually changed
              return newCode !== prevCode ? newCode : prevCode;
            });
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    editorViewRef.current = view;

    // Save the current view for reference
    return () => {
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
      }
    };
  }, [selectedLanguage, getStarterCode, initialSetupDone]);

  // Handler for language change
  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      if (newLanguage === selectedLanguage) return;

      console.log(
        `Switching language from ${selectedLanguage} to ${newLanguage}`
      );

      // Get starter code for the new language
      const languageTemplate = problem?.languages?.find(
        (lang) => lang.name === newLanguage
      );

      if (!languageTemplate) {
        console.error(`No language template found for ${newLanguage}`);
        return;
      }

      // Extract just the function body
      const newStarterCode = languageTemplate.starterCode
        .replace(languageTemplate.codePrefix || "", "")
        .replace(languageTemplate.codeSuffix || "", "")
        .trim();

      // Update the language in state
      setSelectedLanguage(newLanguage);

      // Update the code in the editor with the new starter code
      if (editorViewRef.current) {
        editorViewRef.current.dispatch({
          changes: {
            from: 0,
            to: editorViewRef.current.state.doc.length,
            insert: newStarterCode,
          },
        });
      }

      // Update the code state
      setCode(newStarterCode);

      // Also update the submission with the new language and starter code
      if (submission) {
        const newSubmission = {
          ...submission,
          code: newStarterCode,
          language: newLanguage,
          lastSaved: new Date().toISOString(),
        };

        setSubmission(newSubmission);

        // Save to localStorage
        const storageKey = `assessment_code_${assessmentId}_${problemId}`;
        localStorage.setItem(storageKey, JSON.stringify(newSubmission));
      }

      console.log(`Language switched to ${newLanguage} with new starter code`);
    },
    [
      problem,
      selectedLanguage,
      submission,
      assessmentId,
      problemId,
      setSubmission,
    ]
  );

  // Update editor when language changes - separate from the main editor setup
  useEffect(() => {
    if (!editorViewRef.current || !selectedLanguage || !initialSetupDone)
      return;

    // Don't update if this is the initial setup - that's handled by the previous useEffect
    if (!editorViewRef.current.state) return;

    const starterCode = getStarterCode();

    // If the current code is empty or matches the starter code for a different language,
    // then we should use the starter code for the newly selected language
    const currentCode = editorViewRef.current.state.doc.toString();
    const shouldUseStarterCode =
      !currentCode || (currentCode !== code && code === "");

    // Only reset to starter code if needed
    const newCode = shouldUseStarterCode ? starterCode : currentCode;

    // Don't update the editor if the content is the same
    if (newCode === currentCode) return;

    // Store current cursor and scroll positions
    const selection = editorViewRef.current.state.selection;

    // Type assertion to avoid linter error - we've already checked that state exists
    const editorView = editorViewRef.current as EditorView;

    // Update language-specific configurations
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: newCode,
      },
      effects: languageConf.reconfigure([
        getIndentationSettings(selectedLanguage),
      ]),
      // Use the current selection if we're keeping the same code
      selection: !shouldUseStarterCode ? selection : undefined,
    });

    // Update code state if needed
    if (shouldUseStarterCode) {
      setCode(starterCode);
    }
  }, [selectedLanguage, getStarterCode, languageConf, initialSetupDone]);

  // Manual save function (can be triggered by a Save button)
  const saveCode = useCallback(() => {
    if (!problemId || !assessmentId || !selectedLanguage || !code) return;

    // Get the current code from the editor to ensure we have the latest
    const currentCode = editorViewRef.current
      ? editorViewRef.current.state?.doc.toString()
      : code;

    const newSubmission = {
      code: currentCode,
      language: selectedLanguage,
      lastSaved: new Date().toISOString(),
      results: submission?.results,
    };

    // Update the atom with the new submission
    setSubmission(newSubmission);

    // Save to localStorage
    const storageKey = `assessment_code_${assessmentId}_${problemId}`;
    localStorage.setItem(storageKey, JSON.stringify(newSubmission));

    // Show toast notification
    toast.success("Code saved", {
      duration: 2000,
      position: "bottom-right",
      style: {
        background: "#1F2937",
        color: "#D1D5DB",
        fontSize: "14px",
        borderRadius: "6px",
        padding: "16px",
      },
      icon: "💾",
    });
  }, [
    problemId,
    assessmentId,
    selectedLanguage,
    code,
    submission,
    setSubmission,
  ]);

  // Focus on custom input when toggling it on
  useEffect(() => {
    if (isUsingCustomInput && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [isUsingCustomInput]);

  // Run code with Judge0
  const handleRunCode = async () => {
    if (!code || !selectedLanguage || isRunning) return;

    // Ensure output panel is expanded
    setIsOutputCollapsed(false);

    setIsRunning(true);
    setExecutionResult(null);

    try {
      // Save the code first
      saveCode();

      const input = isUsingCustomInput
        ? customInput
        : problem?.testCases[0]?.input || "";

      // Combine the user's function with the necessary wrapper code
      const fullCode = getFullCode();

      // Call Judge0 API
      const result = await runCode(fullCode, selectedLanguage, input);
      console.log("result", result);

      setExecutionResult({
        status: result.status,
        output: result.output,
        error: result.error,
        input: input,
        executionTime: result.executionTime,
        memory: result.memory,
      });

      setActiveResultTab("output");
    } catch (error) {
      console.error("Error running code:", error);

      setExecutionResult({
        status: "error",
        error: error.message || "Failed to run code",
        input: input,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Run test cases with Judge0
  const handleRunTests = async () => {
    if (!code || !selectedLanguage || isRunning || !problem?.testCases) return;

    // Ensure output panel is expanded
    setIsOutputCollapsed(false);

    setIsRunning(true);
    setTestResults(null);

    try {
      // Save the code first
      saveCode();

      // Prepare all test cases - both visible and hidden
      const testCases = problem.testCases.map((tc) => ({
        input: tc.input,
        output: tc.output,
        isHidden: tc.isHidden || false,
      }));

      // Combine the user's function with the necessary wrapper code
      const fullCode = getFullCode();

      // Call Judge0 API with all test cases
      const results = await runTestCases(fullCode, selectedLanguage, testCases);

      // Process results - we'll mark which test cases are hidden for the UI
      const processedResults = {
        ...results,
        cases: results.cases.map((result, index) => ({
          ...result,
          isHidden: testCases[index]?.isHidden || false,
        })),
      };

      setTestResults(processedResults);
      setActiveResultTab("testcase");

      // Calculate execution time and memory averages
      const execTimes = results.cases
        .map((c) => c.executionTime)
        .filter(Boolean);
      const avgExecTime =
        execTimes.length > 0
          ? execTimes.reduce((a, b) => a + b, 0) / execTimes.length
          : undefined;

      const memories = results.cases.map((c) => c.memory).filter(Boolean);
      const avgMemory =
        memories.length > 0
          ? memories.reduce((a, b) => a + b, 0) / memories.length
          : undefined;

      // Map status to consistent values
      let statusValue = "FAILED";
      if (results.passed === results.total) {
        statusValue = "PASSED";
      } else if (results.passed > 0) {
        statusValue = "FAILED";
      } else {
        statusValue = "ERROR";
      }

      // Update submission with results
      const newSubmission = {
        code,
        language: selectedLanguage,
        lastSaved: new Date().toISOString(),
        results: {
          problemId: problemId,
          testsPassed: results.passed,
          totalTests: results.total,
          status: statusValue, // Use consistent status values
          output:
            results.cases.length > 0 ? results.cases[0].actualOutput : null,
          error: results.cases.find((c) => c.error)?.error || null,
          executionTime: avgExecTime,
          memory: avgMemory,
          runAt: new Date().toISOString(), // Add timestamp for when tests were run
        },
      };

      // Log what we're saving to localStorage
      console.log(`Saving to localStorage for problem ${problemId}:`, {
        status: newSubmission.results.status,
        testsPassed: newSubmission.results.testsPassed,
        totalTests: newSubmission.results.totalTests,
      });

      setSubmission(newSubmission);

      // Update localStorage with consistent data structure
      const storageKey = `assessment_code_${assessmentId}_${problemId}`;
      localStorage.setItem(storageKey, JSON.stringify(newSubmission));

      // Log the update
      console.log(
        `Updated submission for problem ${problemId} with test results:`,
        {
          passed: results.passed,
          total: results.total,
          status: statusValue,
        }
      );
    } catch (error) {
      console.error("Error running tests:", error);

      // Set error results
      const errorResults = {
        passed: 0,
        total: problem.testCases.length,
        cases: problem.testCases.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.output,
          actualOutput: null,
          error: "Failed to run test case",
          passed: false,
          isHidden: tc.isHidden || false,
        })),
        status: "ERROR", // Explicitly set status to ERROR
      };

      setTestResults(errorResults);

      // Save error state to localStorage too
      const newSubmission = {
        code,
        language: selectedLanguage,
        lastSaved: new Date().toISOString(),
        results: {
          problemId: problemId,
          testsPassed: 0,
          totalTests: problem.testCases.length,
          status: "ERROR", // Use consistent status
          output: null,
          error: error instanceof Error ? error.message : "Error running tests",
          runAt: new Date().toISOString(),
        },
      };

      console.log(
        `Saving ERROR status to localStorage for problem ${problemId}`
      );

      setSubmission(newSubmission);

      // Update localStorage with error information
      const storageKey = `assessment_code_${assessmentId}_${problemId}`;
      localStorage.setItem(storageKey, JSON.stringify(newSubmission));
    } finally {
      setIsRunning(false);
    }
  };

  // Handle code submission
  const handleSubmit = async () => {
    if (!code || !selectedLanguage || isSubmitting || !problem?.testCases)
      return;

    // Ensure output panel is expanded
    setIsOutputCollapsed(false);

    setIsSubmitting(true);
    setTestResults(null);

    try {
      // Check for required IDs and show clearer error messages
      if (!assessmentId) {
        console.error(
          "Missing assessmentId for submission. Using URL params:",
          window.location.href
        );
        toast.error("Missing assessment ID. Please reload the page.", {
          duration: 5000,
          position: "top-center",
        });
        return;
      }

      if (!studentId) {
        console.error("Missing studentId for submission");
        toast.error("Missing student ID. Please reload the page.", {
          duration: 5000,
          position: "top-center",
        });
        return;
      }

      // Run tests first to get test results
      console.log("Running tests for submission...");

      // Prepare the code with wrappers as necessary based on language
      const wrapper = getFunctionWrapper();
      const codeToExecute = `${wrapper.prefix}\n${code}\n${wrapper.suffix}`;

      const results = await runTestCases(
        codeToExecute,
        selectedLanguage,
        problem.testCases
      );

      console.log("Test results for submission:", results);

      // Set results for display in UI
      setTestResults(results);
      setActiveResultTab("testcase");

      // Calculate execution stats
      const execTimes = results.cases
        .map((c) => c.executionTime)
        .filter((t) => t !== undefined && t !== null);

      const memories = results.cases
        .map((c) => c.memory)
        .filter((m) => m !== undefined && m !== null);

      const avgExecTime = execTimes.length
        ? execTimes.reduce((a, b) => a + b, 0) / execTimes.length
        : null;

      const avgMemory = memories.length
        ? memories.reduce((a, b) => a + b, 0) / memories.length
        : null;

      // Determine submission status
      const allPassed = results.passed === results.total;
      const statusValue = allPassed ? "COMPLETED" : "FAILED";

      // Calculate score based on test results
      const score = calculateScore(results, problem.score || 0);

      // Update submission in jotai store
      const newSubmission = {
        code,
        language: selectedLanguage,
        lastSaved: new Date().toISOString(),
        results: {
          problemId: problemId,
          testsPassed: results.passed,
          totalTests: results.total,
          status: statusValue,
          output:
            results.cases.length > 0 ? results.cases[0].actualOutput : null,
          error: results.cases.find((c) => c.error)?.error || null,
          executionTime: avgExecTime,
          memory: avgMemory,
          runAt: new Date().toISOString(),
        },
      };

      setSubmission(newSubmission);

      // Save to localStorage for backup
      const storageKey = `assessment_code_${assessmentId}_${problemId}`;
      localStorage.setItem(storageKey, JSON.stringify(newSubmission));

      // Send results to server to save submission
      console.log("Saving submission to the database...");
      const submissionResult = await saveSubmission({
        code,
        language: selectedLanguage,
        status: statusValue as Status,
        score,
        studentId, // Include studentId in the submission
        problemId,
        assessmentId,
        executionTime: avgExecTime,
        memoryUsed: avgMemory,
        errorMessage: results.cases.find((c) => c.error)?.error || null,
        testResults: results,
      });

      console.log("Submission saved to database:", submissionResult);

      // Show success message
      toast.success(
        allPassed
          ? "All tests passed! Submission complete."
          : `${results.passed}/${results.total} tests passed. Submission recorded.`,
        {
          duration: 5000,
          position: "bottom-right",
        }
      );
    } catch (error) {
      console.error("Error submitting code:", error);

      // Show error toast
      toast.error("Failed to submit code. Please try again.", {
        duration: 5000,
        position: "bottom-right",
      });

      // Set error results if possible
      const errorResults = {
        passed: 0,
        total: problem.testCases.length,
        cases: problem.testCases.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.output,
          actualOutput: null,
          error:
            error instanceof Error ? error.message : "Failed to submit code",
          passed: false,
          isHidden: tc.isHidden || false,
        })),
      };

      setTestResults(errorResults);

      // Save error state to submission
      const newSubmission = {
        code,
        language: selectedLanguage,
        lastSaved: new Date().toISOString(),
        results: {
          problemId: problemId,
          testsPassed: 0,
          totalTests: problem.testCases.length,
          status: "ERROR",
          output: null,
          error:
            error instanceof Error ? error.message : "Error submitting code",
          runAt: new Date().toISOString(),
        },
      };

      setSubmission(newSubmission);

      // Update localStorage with error information
      const storageKey = `assessment_code_${assessmentId}_${problemId}`;
      localStorage.setItem(storageKey, JSON.stringify(newSubmission));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the formatted time of last save
  const getLastSavedTime = () => {
    if (!submission?.lastSaved) return null;

    try {
      const lastSaved = new Date(submission.lastSaved);
      return lastSaved.toLocaleTimeString();
    } catch (e) {
      return null;
    }
  };

  // Clean up timeout on component unmount
  useEffect(() => {
    // Handle keyboard shortcuts
    const blockCopyShortcuts = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+X, Ctrl+P, Ctrl+S shortcut keys in the problem description area
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "c" || e.key === "x" || e.key === "p" || e.key === "s")
      ) {
        // Only prevent if we're in the description panel
        const target = e.target as HTMLElement;
        const descriptionPanel = document.querySelector(".description-panel");
        if (
          descriptionPanel &&
          (descriptionPanel.contains(target) ||
            target.closest(".description-panel"))
        ) {
          e.preventDefault();
          setShowCopyWarning(true);

          // Hide warning after 2 seconds
          if (copyWarningTimeoutRef.current) {
            clearTimeout(copyWarningTimeoutRef.current);
          }

          copyWarningTimeoutRef.current = setTimeout(() => {
            setShowCopyWarning(false);
          }, 2000);

          return false;
        }
      }
    };

    // Add event listeners
    document.addEventListener("keydown", blockCopyShortcuts);

    return () => {
      // Clean up both the timeout and event listener
      if (copyWarningTimeoutRef.current) {
        clearTimeout(copyWarningTimeoutRef.current);
      }
      document.removeEventListener("keydown", blockCopyShortcuts);
    };
  }, []);

  // Handler for selection attempts
  const handleSelectionAttempt = () => {
    // Only show the warning if a real selection is attempted (not just clicks)
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      // Clear any existing timeout
      if (copyWarningTimeoutRef.current) {
        clearTimeout(copyWarningTimeoutRef.current);
      }

      // Show the warning
      setShowCopyWarning(true);

      // Hide after 2 seconds
      copyWarningTimeoutRef.current = setTimeout(() => {
        setShowCopyWarning(false);
      }, 2000);

      // Clear the selection
      selection.removeAllRanges();
    }
  };

  // Render description content
  const renderDescription = () => {
    return (
      <div className="p-4 text-gray-200">
        <h1 className="text-2xl font-bold mb-4 select-none">{problem.title}</h1>
        <div className="mb-6">
          <span
            className={`px-2 py-1 rounded text-xs font-medium select-none ${
              problem.difficulty === "Easy"
                ? "bg-green-800 text-green-200"
                : problem.difficulty === "Medium"
                ? "bg-yellow-800 text-yellow-200"
                : "bg-red-800 text-red-200"
            }`}
          >
            {problem.difficulty}
          </span>
        </div>

        <div
          className="whitespace-pre-line mb-6 select-none"
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
          }}
          onCopy={(e) => e.preventDefault()}
        >
          {problem.description}
        </div>

        {/* Function Signature Info */}
        <div className="mb-6 p-4 bg-gray-800/50 rounded-md border border-gray-700">
          <h3 className="font-medium mb-2 text-blue-300 select-none">
            Function Signature:
          </h3>
          <pre
            className="bg-gray-900 p-3 rounded overflow-x-auto text-sm text-gray-300 select-none"
            style={{
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
            }}
            onCopy={(e) => e.preventDefault()}
          >
            {getFunctionWrapper().signature ||
              "Function signature not available"}
          </pre>
        </div>

        <div className="space-y-6">
          {problem.testCases
            .filter((tc) => !tc.isHidden)
            .map((testCase, index) => (
              <div
                key={index}
                className="border border-gray-700 rounded-md p-4 bg-[#131c2e] select-none"
                style={{
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  MozUserSelect: "none",
                  msUserSelect: "none",
                }}
                onCopy={(e) => e.preventDefault()}
              >
                <h3 className="font-medium mb-2">Example {index + 1}:</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-400">Input:</span>{" "}
                    {testCase.input}
                  </div>
                  <div>
                    <span className="text-gray-400">Output:</span>{" "}
                    {testCase.output}
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div
          className="mt-6 border-t border-gray-700 pt-4 select-none"
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
          }}
          onCopy={(e) => e.preventDefault()}
        >
          <h3 className="font-medium mb-2">Constraints:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {problem.description
              .split("Constraints:")[1]
              ?.split("\n")
              .filter((line) => line.trim())
              .map((constraint, i) => (
                <li key={i} className="text-gray-400">
                  {constraint.trim()}
                </li>
              ))}
          </ul>
        </div>
      </div>
    );
  };

  // Render result content for test cases or output
  const renderResultContent = () => {
    if (activeResultTab === "output") {
      return renderOutputContent();
    }

    return (
      <>
        {testResults && (
          <div className="mt-4">
            <div
              className={`mb-4 p-3 rounded flex items-center ${
                testResults.passed === testResults.total
                  ? "bg-green-900/30 text-green-400"
                  : "bg-red-900/30 text-red-400"
              }`}
            >
              <svg
                className={`w-5 h-5 mr-2 ${
                  testResults.passed === testResults.total
                    ? "text-green-500"
                    : "text-red-500"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {testResults.passed === testResults.total ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                )}
              </svg>
              <span>
                {testResults.passed === testResults.total
                  ? `All ${testResults.total} test cases passed!`
                  : `${testResults.passed}/${testResults.total} test cases passed`}
              </span>
            </div>

            {/* Filter out hidden test cases for display */}
            {testResults.cases
              .filter((testCase) => !testCase.isHidden)
              .map((testCase, index) => (
                <div
                  key={index}
                  className={`mb-3 border ${
                    testCase.passed
                      ? "border-green-800/50 bg-green-900/20"
                      : "border-red-800/50 bg-red-900/20"
                  } rounded-md overflow-hidden`}
                >
                  <div
                    className={`px-4 py-2 flex justify-between items-center ${
                      testCase.passed
                        ? "bg-green-900/30 text-green-400"
                        : "bg-red-900/30 text-red-400"
                    }`}
                  >
                    <span className="font-medium">
                      Test Case {index + 1}{" "}
                      {testCase.passed ? "Passed" : "Failed"}
                    </span>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {testCase.passed ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      )}
                    </svg>
                  </div>
                  <div className="p-3">
                    <div className="mb-2">
                      <div className="text-sm text-gray-400 mb-1">Input:</div>
                      <div className="bg-[#131c2e] p-3 rounded border border-gray-700 mb-3">
                        <pre className="text-sm">{testCase.input}</pre>
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="text-sm text-gray-400 mb-1">
                        Expected Output:
                      </div>
                      <div className="bg-[#131c2e] p-3 rounded border border-gray-700 mb-3">
                        <pre className="text-sm">{testCase.expectedOutput}</pre>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">
                        Your Output:
                      </div>
                      <div
                        className={`p-3 rounded border ${
                          testCase.passed
                            ? "bg-green-900/20 border-green-700/50 text-green-300"
                            : "bg-red-900/20 border-red-700/50 text-red-300"
                        }`}
                      >
                        {testCase.actualOutput ? (
                          <pre className="text-sm whitespace-pre-wrap">
                            {testCase.actualOutput}
                          </pre>
                        ) : testCase.error ? (
                          <pre className="text-sm text-red-400 whitespace-pre-wrap">
                            {testCase.error}
                          </pre>
                        ) : (
                          <span className="text-gray-400">No output</span>
                        )}
                      </div>
                    </div>
                    {testCase.executionTime && (
                      <div className="mt-3 text-sm text-gray-400">
                        Execution Time: {testCase.executionTime} sec | Memory:{" "}
                        {testCase.memory
                          ? `${(testCase.memory / 1000).toFixed(2)} MB`
                          : "N/A"}
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {/* Show a note about hidden test cases if they exist */}
            {testResults.cases.some((tc) => tc.isHidden) && (
              <div className="mt-4 p-3 bg-gray-800/50 border border-gray-700 rounded text-gray-300 text-sm">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Some test cases are hidden and not displayed above. Your
                    code is evaluated against all test cases, including hidden
                    ones.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {!testResults && !isRunning && (
          <div className="mt-4">
            <div className="p-3 bg-gray-800/50 border border-gray-700 rounded text-gray-300 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Click "Run Tests" to execute your code against all test cases.
              </span>
            </div>
          </div>
        )}

        {isRunning && (
          <div className="mt-4 flex justify-center p-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </>
    );
  };

  // Render output content for the "Output" tab
  const renderOutputContent = () => {
    return (
      <>
        {/* Custom Input Toggle and Input Box */}
        <div className="mb-4 border border-gray-700 rounded-md overflow-hidden">
          <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
            <span className="font-medium">Custom Input</span>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isUsingCustomInput}
                  onChange={() => setIsUsingCustomInput(!isUsingCustomInput)}
                />
                <div
                  className={`block w-10 h-6 rounded-full transition-colors ${
                    isUsingCustomInput ? "bg-blue-600" : "bg-gray-600"
                  }`}
                ></div>
                <div
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    isUsingCustomInput ? "transform translate-x-4" : ""
                  }`}
                ></div>
              </div>
              <span className="ml-2 text-sm">
                {isUsingCustomInput ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>

          {isUsingCustomInput && (
            <div className="p-3 bg-[#131c2e] border-t border-gray-700">
              <textarea
                ref={customInputRef}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter your custom input here..."
                className="w-full h-24 bg-[#0a0f1a] border border-gray-700 rounded text-gray-200 p-2 font-mono text-sm focus:outline-none focus:border-blue-500"
              ></textarea>
              <div className="mt-2 text-xs text-gray-400">
                Custom input will be used when you click "Run Code" instead of
                the default test case input.
              </div>
            </div>
          )}
        </div>

        {executionResult && (
          <div className="mt-4">
            <div
              className={`mb-4 p-3 rounded flex items-center ${
                executionResult.status === "Accepted"
                  ? "bg-green-900/30 text-green-400"
                  : executionResult.status === "error"
                  ? "bg-red-900/30 text-red-400"
                  : "bg-blue-900/30 text-blue-400"
              }`}
            >
              <svg
                className={`w-5 h-5 mr-2 ${
                  executionResult.status === "Accepted"
                    ? "text-green-500"
                    : executionResult.status === "error"
                    ? "text-red-500"
                    : "text-blue-500"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {executionResult.status === "Accepted" ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                ) : executionResult.status === "error" ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                )}
              </svg>
              <span>
                {executionResult.status === "Accepted"
                  ? "Execution successful!"
                  : executionResult.status === "error"
                  ? "Execution failed"
                  : `Status: ${executionResult.status}`}
              </span>
            </div>

            <div className="space-y-4">
              {/* Input section */}
              <div className="border border-gray-700 rounded-md overflow-hidden">
                <div className="bg-gray-800 px-4 py-2 font-medium">Input</div>
                <div className="p-3 bg-[#131c2e]">
                  <pre className="text-sm whitespace-pre-wrap">
                    {executionResult.input || "No input"}
                  </pre>
                </div>
              </div>

              {/* Output section */}
              <div className="border border-gray-700 rounded-md overflow-hidden">
                <div className="bg-gray-800 px-4 py-2 font-medium">Output</div>
                <div className="p-3 bg-[#131c2e]">
                  {executionResult.output ? (
                    <pre className="text-sm whitespace-pre-wrap">
                      {executionResult.output}
                    </pre>
                  ) : executionResult.error ? (
                    <pre className="text-sm text-red-400 whitespace-pre-wrap">
                      {executionResult.error}
                    </pre>
                  ) : (
                    <span className="text-gray-400">No output</span>
                  )}
                </div>
              </div>

              {/* Execution stats */}
              {(executionResult.executionTime || executionResult.memory) && (
                <div className="mt-2 text-sm text-gray-400 flex gap-4">
                  {executionResult.executionTime && (
                    <div>
                      Execution Time: {executionResult.executionTime} sec
                    </div>
                  )}
                  {executionResult.memory && (
                    <div>
                      Memory: {(executionResult.memory / 1000).toFixed(2)} MB
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {!executionResult && !isRunning && (
          <div className="mt-4">
            <div className="p-3 bg-gray-800/50 border border-gray-700 rounded text-gray-300 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Click "Run Code" to execute your code with the input.</span>
            </div>
          </div>
        )}

        {isRunning && (
          <div className="mt-4 flex justify-center p-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </>
    );
  };

  // If problem is null, render a loading state
  if (!problem) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-2">Redirecting to assessment page...</div>
          <div className="text-sm text-gray-400">Problem ID: {problemId}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0f1a] text-gray-100 flex overflow-hidden">
      {/* Tab switching warning */}
      {showTabWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-900/90 text-white px-4 py-3 rounded-md shadow-lg max-w-md flex items-start z-50">
          <svg
            className="w-5 h-5 mr-2 mt-0.5 text-red-300 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            <p className="font-medium">Tab switching detected!</p>
            <p className="text-sm text-red-200 mt-1">
              Switching tabs during the assessment is not allowed and is being
              recorded. You've switched tabs {tabSwitchCount} time
              {tabSwitchCount !== 1 ? "s" : ""}.
            </p>
          </div>
          <button
            onClick={() => setShowTabWarning(false)}
            className="ml-2 text-red-300 hover:text-white p-1"
            aria-label="Close warning"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Left panel - Description */}
      <div
        className={`${
          isDescriptionCollapsed ? "w-0 md:w-12" : "w-full md:w-2/5 lg:w-[35%]"
        } border-r border-gray-700 overflow-y-auto custom-scrollbar select-none description-panel transition-all duration-300`}
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
          position: "relative",
        }}
        onCopy={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        onMouseUp={handleSelectionAttempt}
        title="Copying problem content is not allowed"
      >
        {/* Toggle button for description panel */}
        <button
          onClick={() => setIsDescriptionCollapsed(!isDescriptionCollapsed)}
          className="absolute top-3 right-3 text-gray-400 hover:text-white z-20 focus:outline-none"
          aria-label={
            isDescriptionCollapsed
              ? "Expand description"
              : "Collapse description"
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isDescriptionCollapsed ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            )}
          </svg>
        </button>

        {!isDescriptionCollapsed && (
          <>
            {/* Copy warning overlay */}
            {showCopyWarning && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg z-50 text-sm flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Copying problem content is not allowed
              </div>
            )}
            <div className="sticky top-0 z-10 bg-[#0a0f1a] border-b border-gray-700">
              <div className="flex">
                <button
                  className={`px-4 py-2 ${
                    activeTab === "description"
                      ? "border-b-2 border-blue-500 font-medium"
                      : "text-gray-400"
                  }`}
                  onClick={() => setActiveTab("description")}
                >
                  Description
                </button>
              </div>
            </div>
            {/* Description content */}
            <div>{renderDescription()}</div>
          </>
        )}

        {isDescriptionCollapsed && (
          <div className="h-full flex items-center justify-center">
            <span className="transform -rotate-90 text-gray-500 whitespace-nowrap">
              Problem Description
            </span>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Language selector */}
        <div className="flex-none border-b border-gray-700 p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm mr-2">Language</span>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="appearance-none bg-[#131c2e] border border-gray-700 text-sm rounded px-2 py-1 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {problem?.languages?.map((lang) => (
                    <option key={lang.id} value={lang.name}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>

              {/* Function signature display */}
              <div className="ml-4 text-xs text-gray-400 flex-1 truncate">
                <span className="font-mono">
                  {getFunctionWrapper().signature || "Function signature"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Editor and Results Container */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Code Editor Section */}
          <div
            className={`flex-1 overflow-hidden bg-[#1e1e1e] ${
              isOutputCollapsed ? "flex-grow" : ""
            }`}
          >
            {/* Last saved indicator and function signature */}
            <div className="flex justify-between items-center px-3 py-1 bg-gray-800/70 border-b border-gray-700">
              <div className="flex items-center">
                <span className="text-xs text-gray-400">
                  {getLastSavedTime()
                    ? `Last saved: ${getLastSavedTime()}`
                    : "Not saved yet"}
                </span>
                {submission?.results && (
                  <span
                    className={`ml-3 text-xs px-2 py-0.5 rounded ${
                      submission.results.status === "PASSED"
                        ? "bg-green-900/50 text-green-400"
                        : "bg-amber-900/50 text-amber-400"
                    }`}
                  >
                    {submission.results.status === "PASSED"
                      ? "All tests passed"
                      : `${submission.results.testsPassed || 0}/${
                          submission.results.totalTests || 0
                        } tests passed`}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!problem || !problem.languages) return;

                    // Find the language template for the currently selected language
                    const languageTemplate = problem.languages.find(
                      (lang) => lang.name === selectedLanguage
                    );

                    if (!languageTemplate) return;

                    // Extract the original starter code directly from the language template
                    const originalStarterCode = languageTemplate.starterCode
                      .replace(languageTemplate.codePrefix || "", "")
                      .replace(languageTemplate.codeSuffix || "", "")
                      .trim();

                    // Update the code state only for current language
                    setCode(originalStarterCode);

                    // Update the editor content
                    if (editorViewRef.current) {
                      editorViewRef.current.dispatch({
                        changes: {
                          from: 0,
                          to: editorViewRef.current.state.doc.length,
                          insert: originalStarterCode,
                        },
                      });

                      // Check if we should update submission
                      if (submission) {
                        // Create a new submission with updated code for current language only
                        const newSubmission = {
                          ...submission,
                          code: originalStarterCode,
                          language: selectedLanguage,
                          lastSaved: new Date().toISOString(),
                        };

                        // Update the submission in the atom
                        setSubmission(newSubmission);

                        // Update localStorage to save the state
                        const storageKey = `assessment_code_${assessmentId}_${problemId}`;
                        localStorage.setItem(
                          storageKey,
                          JSON.stringify(newSubmission)
                        );

                        // Show toast notification
                        toast.success(`Reset code for ${selectedLanguage}`, {
                          duration: 2000,
                          position: "bottom-right",
                          style: {
                            background: "#1F2937",
                            color: "#D1D5DB",
                            fontSize: "14px",
                            borderRadius: "6px",
                            padding: "16px",
                          },
                          icon: "🔄",
                        });
                      }

                      // Focus the editor after reset
                      setTimeout(() => {
                        if (editorViewRef.current) {
                          editorViewRef.current.focus();
                        }
                      }, 100);
                    }
                  }}
                  className="flex items-center text-xs text-gray-300 hover:text-white bg-gray-700/70 hover:bg-gray-600/70 px-2 py-1 rounded transition-colors"
                >
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Reset
                </button>
                <button
                  onClick={saveCode}
                  className="flex items-center text-xs text-gray-300 hover:text-white bg-gray-700/70 hover:bg-gray-600/70 px-2 py-1 rounded transition-colors"
                >
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    ></path>
                  </svg>
                  Save
                </button>
              </div>
            </div>

            {/* Function wrapping indicator */}
            <div className="px-3 py-1 bg-gray-900/70 border-b border-gray-700 text-xs">
              <span className="text-gray-500">
                // Only implement the function body. Framework code will be
                added automatically.
              </span>
            </div>

            <div
              ref={editorRef}
              className="h-full overflow-auto editor-scrollbar"
              style={{
                fontSize: "14px",
                height: isOutputCollapsed
                  ? "calc(90vh - 150px)"
                  : "calc(60vh - 100px)",
                minHeight: "200px",
                maxHeight: isOutputCollapsed
                  ? "calc(90vh - 150px)"
                  : "calc(60vh - 100px)",
              }}
            />
          </div>

          {/* Results Section */}
          <div
            className={`transition-all duration-300 ${
              isOutputCollapsed ? "h-[40px]" : "h-[40%] max-h-[40vh]"
            } min-h-[40px] flex flex-col border-t border-gray-700`}
          >
            {/* Action Buttons with Output Toggle */}
            <div className="flex-none bg-[#1e1e1e] p-0 flex justify-between items-center">
              <div className="flex gap-2 mb-1">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className={`px-3 py-1.5 bg-blue-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors flex items-center ${
                    isRunning
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-blue-500"
                  }`}
                >
                  {isRunning ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-1 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Running...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Run Code
                    </>
                  )}
                </button>
                <button
                  onClick={handleRunTests}
                  disabled={isRunning}
                  className={`px-3 py-1.5 bg-black text-white rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors flex items-center ${
                    isRunning
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-gray-800"
                  }`}
                >
                  {isRunning ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-1 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Testing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      Run Tests
                    </>
                  )}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-3 py-1.5 bg-green-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors flex items-center ${
                    isSubmitting
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-green-500"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-1 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Submit
                    </>
                  )}
                </button>
              </div>

              {/* Output panel toggle button */}
              <button
                onClick={() => setIsOutputCollapsed(!isOutputCollapsed)}
                className="text-gray-400 hover:text-white focus:outline-none p-1"
                aria-label={
                  isOutputCollapsed ? "Expand output" : "Collapse output"
                }
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isOutputCollapsed ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  )}
                </svg>
              </button>
            </div>

            {/* Output content - only shown when not collapsed */}
            {!isOutputCollapsed && (
              <div className="flex-1 overflow-auto custom-scrollbar bg-[#0a0f1a] p-3">
                {/* Results tabs (testcase/output) */}
                <div className="border-b border-gray-700 mb-3">
                  <div className="flex">
                    <button
                      className={`px-4 py-2 flex items-center ${
                        activeResultTab === "output"
                          ? "border-b-2 border-blue-500 font-medium"
                          : "text-gray-400"
                      }`}
                      onClick={() => setActiveResultTab("output")}
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Output
                      {isUsingCustomInput && (
                        <span className="ml-1 text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded">
                          Custom
                        </span>
                      )}
                    </button>
                    <button
                      className={`px-4 py-2 flex items-center ${
                        activeResultTab === "testcase"
                          ? "border-b-2 border-blue-500 font-medium"
                          : "text-gray-400"
                      }`}
                      onClick={() => setActiveResultTab("testcase")}
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      Testcase
                      {testResults && (
                        <span
                          className={`ml-1 text-xs px-1.5 py-0.5 rounded ${
                            testResults.passed === testResults.total
                              ? "bg-green-900 text-green-300"
                              : "bg-red-900 text-red-300"
                          }`}
                        >
                          {testResults.passed}/{testResults.total}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Results content */}
                <div>
                  {activeResultTab === "output"
                    ? renderOutputContent()
                    : renderResultContent()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestProblem;
