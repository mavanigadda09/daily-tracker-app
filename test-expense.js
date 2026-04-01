// ===== UNIT TESTS FOR EXPENSE PARSER =====
// Run with: node -e "require('./test-expense.js')"

const { extractExpense } = require('./aicoach.js');

const testCases = [
  // Valid expenses
  { input: "I spent 500 on food", expected: { amount: 500, type: "expense", category: "Food" } },
  { input: "Spent ₹250.50 on lunch", expected: { amount: 250.5, type: "expense", category: "Food" } },
  { input: "I earned 10000 salary", expected: { amount: 10000, type: "income", category: "Salary" } },
  { input: "Received 500 bonus", expected: { amount: 500, type: "income", category: "Other" } },

  // Invalid cases
  { input: "I ate food", expected: null },
  { input: "Spent -100 on stuff", expected: null },
  { input: "Spent abc on food", expected: null },

  // Edge cases
  { input: "Spent 1,000,000 on travel", expected: null }, // Too large
  { input: "Expense: 100 for utilities", expected: { amount: 100, type: "expense", category: "Utilities" } }
];

console.log("🧪 Testing extractExpense...");

testCases.forEach((test, i) => {
  const result = extractExpense(test.input);
  const passed = result === test.expected ||
    (result && test.expected &&
     result.amount === test.expected.amount &&
     result.type === test.expected.type &&
     result.category === test.expected.category);

  console.log(`${passed ? '✅' : '❌'} Test ${i + 1}: "${test.input}"`);
  if (!passed) {
    console.log(`   Expected:`, test.expected);
    console.log(`   Got:`, result);
  }
});

console.log("✅ Tests completed!");