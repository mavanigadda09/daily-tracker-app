// ===== UNIT TESTS FOR EXPENSE PARSER =====
// Run: node test-expense.js

const { extractExpense } = require('./aicoach.js');

// ===== DEEP COMPARE =====
function isEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ===== TEST RUNNER =====
function runTest(test, index) {
  try {
    const result = extractExpense(test.input);
    const passed = isEqual(result, test.expected);

    console.log(`${passed ? "✅" : "❌"} Test ${index + 1}: "${test.input}"`);

    if (!passed) {
      console.log("   Expected:", test.expected);
      console.log("   Got     :", result);
    }

    return passed;

  } catch (err) {
    console.log(`💥 Test ${index + 1} crashed: "${test.input}"`);
    console.error(err);
    return false;
  }
}

// ===== TEST CASES =====
const testCases = [
  // Valid
  { input: "I spent 500 on food", expected: { amount: 500, type: "expense", category: "Food" } },
  { input: "Spent ₹250.50 on lunch", expected: { amount: 250.5, type: "expense", category: "Food" } },
  { input: "I earned 10000 salary", expected: { amount: 10000, type: "income", category: "Salary" } },
  { input: "Received 500 bonus", expected: { amount: 500, type: "income", category: "Other" } },

  // Invalid
  { input: "I ate food", expected: null },
  { input: "Spent -100 on stuff", expected: null },
  { input: "Spent abc on food", expected: null },

  // Edge
  { input: "Spent 1,000,000 on travel", expected: null },
  { input: "Expense: 100 for utilities", expected: { amount: 100, type: "expense", category: "Utilities" } }
];

// ===== RUN =====
console.log("🧪 Running extractExpense tests...\n");

let passedCount = 0;

testCases.forEach((test, i) => {
  const passed = runTest(test, i);
  if (passed) passedCount++;
});

// ===== SUMMARY =====
console.log("\n📊 Test Summary:");
console.log(`Total   : ${testCases.length}`);
console.log(`Passed  : ${passedCount}`);
console.log(`Failed  : ${testCases.length - passedCount}`);

if (passedCount === testCases.length) {
  console.log("🎉 All tests passed!");
} else {
  console.log("⚠️ Some tests failed.");
}