Feature: "Activity history" page

  Scenario: Land on the activity history page
    Given I go to the "Root" page
    And I sign in as the "default" user
    And I go to the "Activity history" page
    And the page has finished loading
    And I accept cookies
    Then the page title is prefixed with "Activity history - Page 1"
    And the page has the "change your password" link
    And the page has the "Back to Security" link
    And there is a list of activity history items

  Scenario: Change your password from the Activity history area
    Given I go to the "Root" page
    And I sign in as the "default" user
    And I go to the "Security" page
    And the page has finished loading
    And I click the "See your activity history" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 1"
    Given I click the "Page 3" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 3"
    And the page has the "change your password" link
    Given I click the "change your password" link
    And the page has finished loading
    And the page title is prefixed with "Enter your current password"
    Given I enter and submit my password "Pa55w0rd!"
    And the page has finished loading
    Given I enter and submit my new password "NuPa55w0rd!"
    And the page has finished loading
    And the page title is prefixed with "You’ve changed your password"
    And the page looks as expected

  Scenario: Navigate back to paginated Activity history from 'enter password' page using Back links
    Given I go to the "Root" page
    And I sign in as the "default" user
    And I go to the "Security" page
    And the page has finished loading
    And I click the "See your activity history" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 1"
    Given I click the "Page 3" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 3"
    Given I click the "Previous page" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 2"
    Given I click the "change your password" link
    And the page has finished loading
    Given I click the "Back" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 2"

  Scenario: Navigate back to paginated Activity history from 'change your password' page using Cancel link
    Given I go to the "Root" page
    And I sign in as the "default" user
    And I go to the "Activity history" page
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 1"
    Given I click the "Page 3" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 3"
    Given I click the "Previous page" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 2"
    Given I click the "change your password" link
    And the page has finished loading
    Given I enter and submit my password "Pa55w0rd!"
    And the page has finished loading
    Given I click the "Cancel and go back" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 2"

  Scenario: Navigate back to paginated Activity history from 'change password' success page using "Back to activity history" button
    Given I go to the "Root" page
    And I sign in as the "default" user
    And I go to the "Security" page
    And the page has finished loading
    And I click the "See your activity history" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 1"
    Given I click the "Page 3" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 3"
    Given I click the "Previous page" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 2"
    Given I click the "change your password" link
    And the page has finished loading
    Given I enter and submit my password "Pa55w0rd!"
    And the page has finished loading
    Given I enter and submit my new password "NuPa55w0rd!"
    And the page has finished loading
    And the page title is prefixed with "You’ve changed your password"
    Given I click the "Back to activity history" button
    And the page has finished loading
    And I click the "default" button
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 2"

  Scenario: Navigate back to paginated Activity history from 'Enter password' when there has been a form error
    Given I go to the "Root" page
    And I sign in as the "default" user
    And I go to the "Security" page
    And the page has finished loading
    And I click the "See your activity history" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 1"
    Given I click the "Page 3" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 3"
    Given I click the "Previous page" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 2"
    Given I click the "change your password" link
    And the page has finished loading
    Given I enter and submit my password ""
    And the page has finished loading
    Then the page title is prefixed with "Error - Enter your current password"
    Given I click the "Back" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 2"

  Scenario: Navigate back to paginated Activity history from 'Change password' when there has been a form error
    Given I go to the "Root" page
    And I sign in as the "default" user
    And I go to the "Security" page
    And the page has finished loading
    And I click the "See your activity history" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 1"
    Given I click the "Page 3" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 3"
    Given I click the "Previous page" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 2"
    Given I click the "change your password" link
    And the page has finished loading
    Given I enter and submit my password "Pa55w0rd!"
    And the page has finished loading
    Given I enter and submit my new password "NuPa55w0rd!" erroneously
    And the page has finished loading
    Then the page title is prefixed with "Error - Enter your new password"
    Given I click the "Cancel and go back" link
    And the page has finished loading
    Then the page title is prefixed with "Activity history - Page 2"
