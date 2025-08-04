Feature: "Healthcheck" page

  @postDeploy
  Scenario: Visit the "Healthcheck" page
    Given I go to the "Healthcheck" page
    And the page has finished loading
    Then the page looks as expected