/// <reference types="cypress" />

describe('Complete Shopping Flow', () => {
  it('should add an item to the cart and proceed to checkout', () => {
    // 1. Visit the application
    cy.visit('/');
    cy.contains('The Royal Rajputana Collection').should('be.visible');

    // 2. Open Search and look for an item
    cy.get('header button').eq(1).click();
    cy.get('input[placeholder*="Search for royal heritage products"]').type('saree');
    cy.contains('Jaipuri Bandhani Saree').should('be.visible');
    
    // Close search modal
    cy.get('body').type('{esc}');

    // 3. Add an item to the cart
    cy.contains('Quick Add').first().click();
    
    // Select size 'M'
    cy.contains('button', /^M$/).click();

    // Click Add to Cart
    cy.contains('button', 'Add to Cart').click();

    // Wait for the success modal to automatically close
    // Increased to 15 seconds just to be extra safe!
    cy.get('.fixed.inset-0', { timeout: 15000 }).should('not.exist');

    // 4. Verify the cart icon updated to '1'
    cy.get('.bg-red-500.text-white.text-xs').should('have.text', '1');

    // 5. Open the Cart and Proceed to Checkout
    // Wait briefly and target the exact cart button via the red badge
    cy.wait(1000);
    cy.get('.bg-red-500.text-white.text-xs').closest('button').click({ force: true });
    cy.contains('Proceed to Checkout').click({ force: true });

    // NEW: We should be redirected to the sign-in page since we are not logged in!
    cy.contains('Welcome Back').should('be.visible');
    cy.contains('Please sign in or create an account to make a payment.').should('be.visible');
    
    // Log in using our custom Cypress command
    cy.login('test@example.com', 'Password@123!');

    // Ensure the cart state has re-hydrated on the new page before clicking
    cy.get('.bg-red-500.text-white.text-xs', { timeout: 10000 }).should('have.text', '1');

    // 6. Verify we reached the Checkout page safely (App auto-redirects here after login!)
    cy.url({ timeout: 10000 }).should('include', '/checkout');
    cy.contains('Place Order', { matchCase: false, timeout: 10000 }).should('be.visible');

    // 7. Fill out the Shipping Address
    // Using case-insensitive placeholders/names to reliably find your inputs
    cy.get('input[name="name"], input[placeholder*="Name" i]').first().clear().type('Rajput Heritage');
    cy.get('input[name="address"], input[placeholder*="Address" i]').first().clear().type('123 Royal Palace Road');
    cy.get('input[name="city"], input[placeholder*="City" i]').first().clear().type('Jaipur');
    cy.get('input[name="pincode"], input[placeholder*="PIN" i], input[placeholder*="Zip" i]').first().clear().type('302001');

    // 8. Select the Payment Method
    // Choosing 'Cash on Delivery' bypasses the need for fake card numbers and expiry validation
    cy.contains(/Cash on Delivery|COD/i).click({ force: true });

    // 9. Submit the Order!
    cy.contains('button', 'Place Order', { matchCase: false }).click();

    // 10. Verify successful placement (Order Summary receipt)
    cy.contains('Order Summary', { timeout: 15000 }).should('be.visible');
    
    // Verify the system generated the custom Order ID (PHN-XXXXXX) mentioned in your React tests!
    cy.contains(/PHN-[A-Z0-9]+/i).should('be.visible');
  });
});