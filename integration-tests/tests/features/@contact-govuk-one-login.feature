Feature: "Contact GOV.UK One Login" page

  @failMobile
  Scenario: Visit the "Contact GOV.UK One Login" page
    Given I go to the "Contact GOV.UK One Login" page
    And the page has finished loading
    And I accept cookies
    Then the page title is "Contact GOV.UK One Login"
    And the page looks as expected
    And the page is accessible
    And the page displays the expected webchat content

  @noJs
  Scenario: Visit the "Contact GOV.UK One Login" page with JavaScript disabled
    Given I go to the "Contact GOV.UK One Login" page
    Then the page looks as expected
    And the page title is "Contact GOV.UK One Login"
    And the page displays the expected webchat content

  @postDeploy
  Scenario: Access webchat via the inline button
    Given I go to the "Contact GOV.UK One Login" page
    And the page has finished loading
    And I accept cookies
    When I click on the inline webchat button
    Then the webchat appears
    When I click on the minimise webchat button
    Then the webchat disappears

  @postDeploy
  Scenario: Access webchat via the floating button
    Given I go to the "Contact GOV.UK One Login" page
    And the page has finished loading
    And I accept cookies
    When I click on the floating webchat button
    Then the webchat appears
    When I click on the minimise webchat button
    Then the webchat disappears    