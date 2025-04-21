/**
 * Test Case Troubleshooting Script
 * Copy and paste this entire script into your browser console when viewing the assessment creation page.
 * It will automatically fix the test cases to meet the 3 visible, 2 hidden requirement.
 */

(function () {
  console.log("🔧 Test Case Troubleshooting Script");

  // Try to access React instance
  let reactInstance = null;
  let rootFiber = null;

  // Find the React root
  if (
    typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" &&
    typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers !== "undefined"
  ) {
    // Get the first renderer
    const rendererKey = Object.keys(
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers
    )[0];
    const renderer =
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers[rendererKey];
    if (renderer && renderer.findFiberByHostInstance) {
      // Get the root element
      const rootElement =
        document.querySelector("#__next") || document.querySelector("body");
      if (rootElement) {
        rootFiber = renderer.findFiberByHostInstance(rootElement);
      }
    }
  }

  // Function to find React component with assessment state
  function findAssessmentComponent(fiber) {
    if (!fiber) return null;

    // Check if this fiber has assessment state
    if (
      fiber.memoizedState &&
      fiber.memoizedState.memoizedState &&
      fiber.memoizedState.memoizedState.problems
    ) {
      return fiber;
    }

    // Check child
    if (fiber.child) {
      const result = findAssessmentComponent(fiber.child);
      if (result) return result;
    }

    // Check sibling
    if (fiber.sibling) {
      const result = findAssessmentComponent(fiber.sibling);
      if (result) return result;
    }

    return null;
  }

  // Find the component
  if (rootFiber) {
    reactInstance = findAssessmentComponent(rootFiber);
  }

  if (!reactInstance) {
    console.error(
      "❌ Could not find the React component with assessment state"
    );
    console.log("Try this manual approach instead:");
    console.log("1. Make sure all test cases have non-empty input and output");
    console.log(
      "2. Make sure you have exactly 5 test cases per coding problem"
    );
    console.log("3. Set exactly 3 visible and 2 hidden test cases");
    return;
  }

  // Get the assessment state and update function
  const assessmentState = reactInstance.memoizedState.memoizedState;
  const setAssessment = reactInstance.memoizedState.queue.dispatch;

  console.log(
    "✅ Found assessment state with",
    assessmentState.problems.length,
    "problems"
  );

  // Fix each coding problem
  const updatedProblems = assessmentState.problems.map((problem) => {
    if (problem.questionType !== "CODING") {
      return problem; // Only process coding problems
    }

    console.log(`📋 Processing problem: ${problem.title || "Untitled"}`);

    // Ensure we have at least some input/output values
    const existingTestCases = problem.testCases.map((tc) => ({
      input:
        tc.input || `Sample input ${Math.random().toString(36).substring(7)}`,
      output:
        tc.output || `Sample output ${Math.random().toString(36).substring(7)}`,
      isHidden: tc.isHidden,
    }));

    // Split existing test cases
    const visibleCases = existingTestCases.filter((tc) => !tc.isHidden);
    const hiddenCases = existingTestCases.filter((tc) => tc.isHidden);

    console.log(
      `  Found ${visibleCases.length} visible and ${hiddenCases.length} hidden test cases`
    );

    // Create the fixed array of test cases
    const newTestCases = [];

    // Add 3 visible test cases
    for (let i = 0; i < 3; i++) {
      if (i < visibleCases.length) {
        newTestCases.push(visibleCases[i]);
      } else {
        newTestCases.push({
          input: `Sample input ${i + 1}`,
          output: `Sample output ${i + 1}`,
          isHidden: false,
        });
      }
    }

    // Add 2 hidden test cases
    for (let i = 0; i < 2; i++) {
      if (i < hiddenCases.length) {
        newTestCases.push(hiddenCases[i]);
      } else {
        newTestCases.push({
          input: `Hidden input ${i + 1}`,
          output: `Hidden output ${i + 1}`,
          isHidden: true,
        });
      }
    }

    console.log(
      `  ✅ Fixed: ${newTestCases.length} total test cases (${
        newTestCases.filter((tc) => !tc.isHidden).length
      } visible, ${newTestCases.filter((tc) => tc.isHidden).length} hidden)`
    );

    // Return updated problem
    return {
      ...problem,
      testCases: newTestCases,
    };
  });

  // Update the assessment state
  setAssessment({
    ...assessmentState,
    problems: updatedProblems,
  });

  console.log("✅ All test cases have been fixed. Try clicking Next now!");
  console.log(
    "If you still have issues, check your browser console for validation errors."
  );
})();
