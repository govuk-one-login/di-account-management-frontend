Feature: Contact GOV.UK One Login

  Scenario: Visiting the contact page
    Given I visit the contact page
    Then the page should have status code 200
    And the page should display the expected webchat content

  @nojs
  Scenario: Visiting the contact page with JavaScript disabled
    Given I visit the contact page
    Then the page should have status code 200
    And the page should display the expected webchat content

  Scenario: Accessing webchat via the inline button
    Given I am not testing against a local deployment
    And I visit the contact page
    And webchat has initialised
    When I click on the inline webchat button
    Then the webchat appears
    Given I click on the minimise webchat button
    Then the webchat disappears

  Scenario: Accessing webchat via the floating button
    Given I am not testing against a local deployment
    Given I visit the contact page
    And webchat has initialised
    When I click on the floating webchat button
    Then the webchat appears
    Given I click on the minimise webchat button
    Then the webchat disappears
