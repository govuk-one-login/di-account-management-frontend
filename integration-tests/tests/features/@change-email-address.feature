Feature: Change email address

  @failMobile
  Scenario: Change email address
    Given I go to the "Root" page
    And I sign in as the "default" user
    And I go to the "Security" page
    Then the page title is prefixed with "Security"
    Given I click the "Change email address" link
    And the page has finished loading
    Then the page meets our accessibility standards
    And the page title is prefixed with "Enter your password"
    Given I enter and submit my password "Pa55w0rd!"
    And the page has finished loading
    Then the page meets our accessibility standards
    And the page title is prefixed with "Enter your new email address"
    Given I enter and submit my new email address "new.email.address@test.com"
    And the page has finished loading
    Then the page meets our accessibility standards
    And the page title is prefixed with "Check your email"
    Given I enter and submit the code "123456" sent to my new email address "new.email.address@test.com"
    And the page has finished loading
    Then the page meets our accessibility standards
    And the page title is prefixed with "You’ve changed your email address"
    And I am shown a message confirming that my email address has been changed to "new.email.address@test.com"

  Scenario: Email address can't be used
    Given I go to the "Root" page
    And I sign in as the "default" user
    Then I go to the "Security" page
    And I click the "Change email address" link
    Then I enter and submit my password "Pa55w0rd!"
    Then I enter and submit my new email address "fail.email.check@test.com"
    Then I enter and submit the code "123456" sent to my new email address "fail.email.check@test.com"
    And the page has finished loading
    Then I am shown an error message explaining that this email address can't be used
    And the page looks as expected