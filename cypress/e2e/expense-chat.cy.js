describe('Expense Management via Chat', () => {
  beforeEach(() => {
    // Login and clear any existing data
    cy.login()
    cy.clearLocalStorage()
    cy.visit('/')
    // Ensure we're on the dashboard
    cy.url().should('not.include', '/login')
  })

  it('should add an expense through chat input', () => {
    // Navigate to chat page
    cy.navigateTo('/chat')

    // Wait for chat to load
    cy.contains('🤖 AI Coach').should('be.visible')

    // Add expense via chat
    cy.addExpenseViaChat('I spent 500 on food')

    // Wait for AI response and verify expense was added
    cy.contains('💸 EXPENSE added: ₹500 for Food', { timeout: 5000 }).should('be.visible')

    // Verify the expense appears in the Finance dashboard
    cy.navigateTo('/finance')

    // Check that the expense appears in the transactions list
    cy.contains('₹500').should('be.visible')
    cy.contains('Food').should('be.visible')

    // Verify the expense appears in the summary card
    cy.get('.card').contains('Expense').parent().should('contain', '500')
  })

  it('should handle invalid expense input gracefully', () => {
    // Navigate to chat
    cy.navigateTo('/chat')

    // Add invalid expense
    cy.addExpenseViaChat('I spent abc on food')

    // Should show error message
    cy.contains("I couldn't parse that transaction", { timeout: 5000 }).should('be.visible')
  })

  it('should add income through chat input', () => {
    // Navigate to chat
    cy.navigateTo('/chat')

    // Add income via chat
    cy.addExpenseViaChat('I earned 10000 salary')

    // Verify income was recorded
    cy.contains('💸 INCOME recorded: ₹10,000 for Salary', { timeout: 5000 }).should('be.visible')

    // Check Finance dashboard
    cy.navigateTo('/finance')
    cy.contains('₹10,000').should('be.visible')
    cy.contains('Salary').should('be.visible')

    // Verify income appears in summary
    cy.get('.card').contains('Income').parent().should('contain', '10,000')
  })

  it('should handle various expense formats', () => {
    cy.navigateTo('/chat')

    // Test different formats
    const testCases = [
      { input: 'Spent ₹250.50 on coffee', expected: '₹250.50' },
      { input: 'I bought groceries for 1200 rupees', expected: '₹1,200' },
      { input: 'Travel expense: 3000 for flight', expected: '₹3,000' }
    ]

    testCases.forEach(({ input, expected }) => {
      cy.addExpenseViaChat(input)
      cy.contains(expected, { timeout: 5000 }).should('be.visible')
    })
  })

  it('should prevent duplicate expenses within 5 minutes', () => {
    cy.navigateTo('/chat')

    // Add first expense
    cy.addExpenseViaChat('I spent 250 on coffee')
    cy.contains('💸 EXPENSE added: ₹250 for Food', { timeout: 5000 }).should('be.visible')

    // Try to add the same expense again immediately
    cy.addExpenseViaChat('I spent 250 on coffee')

    // Should not show success message for duplicate
    cy.get('.msg').last().should('not.contain', 'EXPENSE added')
  })

  it('should categorize expenses correctly', () => {
    cy.navigateTo('/chat')

    const categoryTests = [
      { input: 'I spent 100 on Netflix subscription', category: 'Entertainment' },
      { input: 'Medical bill for 500', category: 'Health' },
      { input: 'Electricity bill 2000', category: 'Utilities' },
      { input: 'Book purchase 300', category: 'Education' }
    ]

    categoryTests.forEach(({ input, category }) => {
      cy.addExpenseViaChat(input)
      cy.contains(`for ${category}`, { timeout: 5000 }).should('be.visible')
    })
  })
})