Feature: "Security" page

  @failMobile
  Scenario: Visit the "Security" page
    Given I go to the "Root" page
    And I sign in as the "default" user
    And I go to the "Security" page
    And the page has finished loading
    And I accept cookies
    Then the page title is prefixed with "Security"
    And the page looks as expected
    And the page is accessible