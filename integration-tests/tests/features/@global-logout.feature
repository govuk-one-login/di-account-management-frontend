Feature: Global logout

  @failMobile
  Scenario: A user triggers a global logout
    Given I go to the "Root" page
    And I sign in as the "default" user
    And the page has finished loading
    And I go to the "Security" page
    Then the page title is prefixed with "Security"
    Given I click the "Sign out of all devices" link
    And the page has finished loading
    Then the page meets our accessibility standards
    And the page looks as expected
    And the page title is prefixed with "Sign out of all devices"
    Given I click the "Sign out of all devices" button
    And the page has finished loading
    And the page title is prefixed with "Enter your password"
    And the page looks as expected
    Given I enter and submit my password "Pa55w0rd!"
    And the page has finished loading
    Then I am on the sign in page

  Scenario: A user in the wrong state can't trigger a global logout
    Given I go to the "Root" page
    And I sign in as the "default" user
    And the page has finished loading
    And I go to the "Global logout confirm" page
    And the page has finished loading
    Then the page title is prefixed with "Your services"
