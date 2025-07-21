Feature: Cookie consent banner

  Scenario: Accepting cookies
    Given I visit the contact page
    And I click to accept cookies
    Then I am shown a message confirming my acceptance
    And I can dismiss the confirmation message
    And the cookie consent banner does not show again when the page is refreshed

  Scenario: Rejecting cookies
    Given I visit the contact page
    And I click to reject cookies
    Then I am shown a message confirming my rejection
    And I can dismiss the confirmation message
    And the cookie consent banner does not show again when the page is refreshed
