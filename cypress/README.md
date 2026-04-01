# Cypress End-to-End Tests

This directory contains Cypress tests for the expense management functionality.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Make sure the development server is running:
   ```bash
   npm run dev
   ```

## Running Tests

### Run tests in headless mode:
```bash
npm run test:e2e
```

### Open Cypress Test Runner:
```bash
npm run test:e2e:open
```

## Test Structure

### `expense-chat.cy.js`
Tests the expense management functionality through the AI chat interface:

- **Adding expenses via chat**: Tests parsing natural language expense inputs
- **Error handling**: Tests invalid input handling
- **Income tracking**: Tests income addition via chat
- **Various formats**: Tests different expense input formats
- **Duplicate prevention**: Tests duplicate expense detection
- **Category detection**: Tests automatic expense categorization

## Custom Commands

### `cy.login(email, password)`
Logs in with the specified credentials (defaults to test@example.com/testpassword)

### `cy.addExpenseViaChat(message)`
Types a message in the chat textarea and sends it

### `cy.navigateTo(path)`
Clicks the navigation link for the specified path

## Test Data

The tests use a test user account. Make sure Firebase is configured to allow test user registration, or create the test user manually in Firebase Console.

## Notes

- Tests assume the app is running on `http://localhost:5173`
- Tests clear localStorage between runs to ensure clean state
- Some tests may fail if Firebase authentication is not properly configured
- Tests include timeouts for async operations like AI processing