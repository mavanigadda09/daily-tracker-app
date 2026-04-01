// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to login
Cypress.Commands.add('login', (email = 'test@example.com', password = 'testpassword') => {
  // For Firebase auth, we need to handle authentication state properly
  // cy.session might not work well with Firebase tokens, so we'll login each time
  cy.visit('/login')
  // Clear any existing inputs first
  cy.get('input[placeholder="Email"]').clear().type(email)
  cy.get('input[placeholder="Password"]').clear().type(password)
  cy.get('button').contains(/^Login$/).click()
  // Wait for successful login and redirect
  cy.url({ timeout: 15000 }).should('not.include', '/login')
  // Wait a bit for Firebase auth to settle
  cy.wait(1000)
})

// Custom command to add expense via chat
Cypress.Commands.add('addExpenseViaChat', (message) => {
  // More specific selector for chat textarea
  cy.get('textarea[placeholder*="Ask your coach"]').should('be.visible').clear().type(message)
  cy.get('button').contains('Send').should('be.visible').click()
  // Wait a bit for the message to be processed
  cy.wait(500)
})

// Custom command to navigate to page
Cypress.Commands.add('navigateTo', (path) => {
  // Wait for sidebar to be visible and clickable
  cy.get(`a[href="${path}"]`, { timeout: 10000 }).should('be.visible').click()
  cy.url({ timeout: 10000 }).should('include', path)
  // Wait for page to load
  cy.wait(500)
})

// Custom command to register a new user
Cypress.Commands.add('register', (email, password) => {
  cy.visit('/login')
  // Switch to register mode
  cy.contains("Don't have an account? Sign up").click()
  cy.get('input[placeholder="Email"]').clear().type(email)
  cy.get('input[placeholder="Password"]').clear().type(password)
  cy.get('button').contains('Create Account').click()
  cy.url({ timeout: 15000 }).should('not.include', '/login')
})

// Custom command to logout
Cypress.Commands.add('logout', () => {
  // Assuming there's a logout button in the layout
  cy.get('button').contains(/logout|sign out/i).click()
  cy.url({ timeout: 10000 }).should('include', '/login')
})