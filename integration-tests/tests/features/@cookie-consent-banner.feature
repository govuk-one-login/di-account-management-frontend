Feature: Cookie consent banner

  Scenario: Accept cookies
    Given I go to the "Contact GOV.UK One Login" page
    Then the cookie consent banner shows
    And the cookie consent banner looks as expected
    Given I click to accept cookies
    Then I am shown a message confirming my acceptance
    And the message confirming my acceptance looks as expected
    And I can dismiss the confirmation message
    And the cookie consent banner does not show again when the page is refreshed

  Scenario: Reject cookies
    Given I go to the "Contact GOV.UK One Login" page
    Then the cookie consent banner shows
    Given I click to reject cookies
    Then I am shown a message confirming my rejection
    And the message confirming my rejection looks as expected
    And I can dismiss the confirmation message
    And the cookie consent banner does not show again when the page is refreshed