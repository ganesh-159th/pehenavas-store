/// <reference types="cypress" />

describe('Pehenavas Storefront Complex Flow', () => {
  beforeEach(() => {
    // Visit the main storefront page directly.
    // Change the URL/port if your local dev server runs on a different one.
    cy.visit('http://localhost:5174/')
  })

  // Note: We use a regular `function()` here instead of an arrow function `() =>` 
  // so that we can access `this.currentTest` context provided by Mocha/Cypress.
  afterEach(function () {
    if (this.currentTest.state === 'passed') {
      cy.task('log', `\n✅ TEST PASSED: ${this.currentTest.title}\n`)
    } else if (this.currentTest.state === 'failed') {
      cy.task('log', `\n❌ TEST FAILED: ${this.currentTest.title}`)
      cy.task('log', `❓ REASON: ${this.currentTest.err.message}\n`)
    }
  })

  it('should load the main page and display the product feed', () => {
    // Verify the storefront loaded successfully
    cy.get('body').should('be.visible')
    
    // Verify that the product feed has loaded by checking for your actual collection text
    cy.contains('The Royal Rajputana Collection', { timeout: 10000 }).should('be.visible')
  })

  it('should allow a user to add an item to the shopping cart', () => {
    // 1. Click the "Quick Add" button on the first product
    cy.contains('Quick Add', { timeout: 10000 }).first().click()
    
    // 2. Select the size 'M' and confirm Add to Cart
    cy.contains('button', /^M$/, { timeout: 10000 }).click()
    cy.contains('button', 'Add to Cart', { timeout: 10000 }).click()
    
    // Wait for the success modal to automatically close
    cy.get('.fixed.inset-0', { timeout: 15000 }).should('not.exist')

    // 3. Verify the Cart badge updates to show 1 item using your Tailwind classes
    cy.get('.bg-red-500.text-white.text-xs', { timeout: 10000 }).should('have.text', '1')

    // 4. Navigate to the shopping cart page/modal
    // Wait for a brief moment for any add-to-cart toast/modal animations to clear
    cy.wait(1000)
    // Target the cart button perfectly by finding the badge and clicking its parent button
    cy.get('.bg-red-500.text-white.text-xs').closest('button').click({ force: true })
    
    // 5. Automate the sign-in process since unauthenticated users are redirected
    cy.url({ timeout: 10000 }).should('include', '/signin')
    
    // Log in using our custom Cypress command
    cy.login('test@example.com', 'Password@123!')

    // Ensure the cart state has re-hydrated on the new page before clicking
    cy.get('.bg-red-500.text-white.text-xs', { timeout: 10000 }).should('have.text', '1')

    // 6. The application automatically redirects to /checkout after login!
    // We can safely skip trying to re-open the cart drawer.
    
    // 7. Verify we safely reached the Checkout page
    cy.url({ timeout: 10000 }).should('include', '/checkout')
    cy.contains('Place Order', { matchCase: false, timeout: 15000 }).should('be.visible')
  })
})