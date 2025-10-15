Feature: Global logout

  @failMobile @skip
  Scenario: A user triggers a global logout
    Given I go to the "Root" page
    And I sign in as the "userPerformanceTest" user
    And I go to the "Security" page
    Then the page title is prefixed with "Security"
    Given I click the "Sign out of all devices" link
    Then the page meets our accessibility standards
    And the page looks as expected
    And the page title is prefixed with "Sign out of all devices"
    Given I click the "Sign out of all devices" button
    And the page title is prefixed with "Enter your password"
    And the page looks as expected
    Given I enter and submit my password "Pa55w0rd!"
    Then I am on the sign in page

  @skip
  Scenario: A user in the wrong state can't trigger a global logout
    Given I go to the "Root" page
    And I sign in as the "userPerformanceTest" user
    And I go to the "Global logout confirm" page
    Then the page title is prefixed with "Your services"

  @skip
  Scenario: A temporarily suspended user can trigger a global logout
    Given I go to the "Root" page
    And I sign in as the "temporarilySuspended" user
    And I go to the "Security" page
    Then the page title is prefixed with "Security"
    Given I click the "Sign out of all devices" link
    And the page title is prefixed with "Sign out of all devices"
    Given I click the "Sign out of all devices" button
    And the page title is prefixed with "Enter your password"
    Given I enter and submit my password "Pa55w0rd!"
    Then the page contains the text "You cannot use your GOV.UK One Login at the moment"


  @skip
  Scenario: A permanently suspended user can't trigger a global logout
    Given I go to the "Root" page
    And I sign in as the "permanentlySuspended" user
    And I go to the "Security" page
    Then the page title is prefixed with "Security"
    Given I click the "Sign out of all devices" link
    And the page title is prefixed with "Sign out of all devices"
    Given I click the "Sign out of all devices" button
    And the page title is prefixed with "Enter your password"
    Given I enter and submit my password "Pa55w0rd!"
    Then the page title is prefixed with "Your GOV.UK One Login has been permanently locked"
