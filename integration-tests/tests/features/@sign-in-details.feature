Feature: "Sign in details" page

  @failMobile
  Scenario: Visit the "Sign in details" page as a user with no passkeys
    Given I go to the "Root" page
    And I sign in as the "noPasskeys" user
    And I go to the "Sign in details" page
    And the page has finished loading
    And I accept cookies
    Then the page title is prefixed with "Sign in details"
    And there are 0 passkeys in the list
    And the page meets our accessibility standards

  Scenario: Visit the "Sign in details" page as a user with one passkey
    Given I go to the "Root" page
    And I sign in as the "onePasskey" user
    And I go to the "Sign in details" page
    And the page has finished loading
    And I accept cookies
    Then the page title is prefixed with "Sign in details"
    And there are 1 passkeys in the list
    And the page looks as expected

  Scenario: Visit the "Sign in details" page as a user with fewer than five passkeys
    Given I go to the "Root" page
    And I sign in as the "fourPasskeys" user
    And I go to the "Sign in details" page
    And the page has finished loading
    And I accept cookies
    Then the page title is prefixed with "Sign in details"
    And there are 4 passkeys in the list

  Scenario: Visit the "Sign in details" page as a user with five passkeys
    Given I go to the "Root" page
    And I sign in as the "fivePasskeys" user
    And I go to the "Sign in details" page
    And the page has finished loading
    And I accept cookies
    Then the page title is prefixed with "Sign in details"
    And there are 5 passkeys in the list

  Scenario: Visit the "Sign in details" page as a user with an unidentified passkey
    Given I go to the "Root" page
    And I sign in as the "onePasskeyNoDisplayName" user
    And I go to the "Sign in details" page
    And the page has finished loading
    And I accept cookies
    Then the page title is prefixed with "Sign in details"
    And there are 1 passkeys in the list
    And the passkey appears as 'saved to: provider unknown'
    And the page looks as expected

  @noJs
  Scenario: Visit the "Sign in details" page as a user with less than five passkeys and Javascript disabled
    Given I go to the "Root" page
    And I sign in as the "fourPasskeys" user
    And I go to the "Sign in details" page
    And the page has finished loading
    And the option to create a passkey is hidden
    And the page looks as expected

  @noJs
  Scenario: Visit the "Sign in details" page as a user with no passkeys and Javascript disabled
    Given I go to the "Root" page
    And I sign in as the "noPasskeys" user
    And I go to the "Sign in details" page
    And the page has finished loading
    And the option to create a passkey is hidden
    And the page looks as expected
