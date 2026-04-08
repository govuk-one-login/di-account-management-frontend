Feature: "Sign in details" page

  # Expected to fail on mobile due to known accessibility issues
  @failMobile
  Scenario: Visit the "Sign in details" page as a user with no passkeys
    Given I go to the "Root" page
    And I sign in as the "noPasskeys" user
    And I go to the "Sign in details" page
    And the page has finished loading
    And I accept cookies
    Then the page title is prefixed with "Sign in details"
    And there are 0 passkeys in the list
    And the page looks as expected
    And the page meets our accessibility standards

  @noJs
  Scenario: Visit the "Sign in details" page as a user with no passkeys and JavaScript disabled
    Given I go to the "Root" page
    And I sign in as the "noPasskeys" user
    And I go to the "Sign in details" page
    And the page has finished loading
    Then the page title is prefixed with "Sign in details"
    And there are 0 passkeys in the list
    And the option to create a passkey is hidden
    And the page looks as expected    

  # Expected to fail on mobile due to known accessibility issues
  @failMobile
  Scenario: Visit the "Sign in details" page as a user with one passkey
    Given I go to the "Root" page
    And I sign in as the "onePasskey" user
    And I go to the "Sign in details" page
    And the page has finished loading
    And I accept cookies
    Then the page title is prefixed with "Sign in details"
    And there are 1 passkeys in the list
    And the page looks as expected
    And the page meets our accessibility standards

  @noJs
  Scenario: Visit the "Sign in details" page as a user with one passkey and JavaScript disabled
    Given I go to the "Root" page
    And I sign in as the "onePasskey" user
    And I go to the "Sign in details" page
    And the page has finished loading
    Then the page title is prefixed with "Sign in details"
    And there are 1 passkeys in the list
    And the option to create a passkey is hidden
    And the page looks as expected    

  # Expected to fail on mobile due to known accessibility issues
  @failMobile
  Scenario: Visit the "Sign in details" page as a user with one passkey with no display name
    Given I go to the "Root" page
    And I sign in as the "onePasskeyNoDisplayName" user
    And I go to the "Sign in details" page
    And the page has finished loading
    And I accept cookies
    Then the page title is prefixed with "Sign in details"
    And there are 1 passkeys in the list
    And the page looks as expected
    And the page meets our accessibility standards

  @noJs
  Scenario: Visit the "Sign in details" page as a user with one passkey with no display name and JavaScript disabled
    Given I go to the "Root" page
    And I sign in as the "onePasskeyNoDisplayName" user
    And I go to the "Sign in details" page
    And the page has finished loading
    Then the page title is prefixed with "Sign in details"
    And there are 1 passkeys in the list
    And the option to create a passkey is hidden
    And the page looks as expected    

  # Expected to fail on mobile due to known accessibility issues
  @failMobile
  Scenario: Visit the "Sign in details" page as a user with fewer than the maximum number of passkeys
    Given I go to the "Root" page
    And I sign in as the "fourPasskeys" user
    And I go to the "Sign in details" page
    And the page has finished loading
    And I accept cookies
    Then the page title is prefixed with "Sign in details"
    And there are 4 passkeys in the list
    And the page looks as expected
    And the page meets our accessibility standards

  @noJs
  Scenario: Visit the "Sign in details" page as a user with fewer than the maximum number of passkeys and JavaScript disabled
    Given I go to the "Root" page
    And I sign in as the "fourPasskeys" user
    And I go to the "Sign in details" page
    And the page has finished loading
    Then the page title is prefixed with "Sign in details"
    And there are 4 passkeys in the list
    And the option to create a passkey is hidden
    And the page looks as expected    

  # Expected to fail on mobile due to known accessibility issues
  @failMobile
  Scenario: Visit the "Sign in details" page as a user with the maximum number of passkeys
    Given I go to the "Root" page
    And I sign in as the "fivePasskeys" user
    And I go to the "Sign in details" page
    And the page has finished loading
    And I accept cookies
    Then the page title is prefixed with "Sign in details"
    And there are 5 passkeys in the list
    And the option to create a passkey is hidden
    And the page looks as expected
    And the page meets our accessibility standards

  @noJs
  Scenario: Visit the "Sign in details" page as a user with the maximum number of passkeys and JavaScript disabled
    Given I go to the "Root" page
    And I sign in as the "fivePasskeys" user
    And I go to the "Sign in details" page
    And the page has finished loading
    Then the page title is prefixed with "Sign in details"
    And there are 5 passkeys in the list
    And the option to create a passkey is hidden
    And the page looks as expected    