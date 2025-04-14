Feature: Cookie consent banner

  Scenario: Rejecting cookies
    Given I visit the contact page
    And I click to reject cookies
    Then I am shown a message confirming my rejection
    And I can dismiss the confirmation message
