Feature: Contact GOV.UK One Login

  Scenario: Visiting the contact page
    Given I visit the contact page
    Then the page should have status code 200

  Scenario: Accessing webchat via the inline button
    Given I visit the contact page
    And webchat has initialised
    When I click on the inline webchat button
    Then the webchat appears
    Given I click on the minimise webchat button
    Then the webchat disappears

  Scenario: Accessing webchat via the floating button
    Given I visit the contact page
    And webchat has initialised
    When I click on the floating webchat button
    Then the webchat appears
    Given I click on the minimise webchat button
    Then the webchat disappears    