Feature: "Healthcheck" page

  @postDeploy
  Scenario: Visit the "Healthcheck" page
    Given I go to the "Healthcheck" page
    Then the page looks as expected
