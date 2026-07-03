Feature: Manage passkeys

Scenario: add a passkey
  Given I go to the "Root" page
  And I sign in as the "onePasskey" user
  And I go to the "Security" page
  Then I click the "Manage your sign in details" link
  Then I click the "Set up a passkey" link
  Then I enter and submit my password "qwerty"
  Then I click the "passkey-create success" link
  Then the page contains the text "Your passkey is saved to Windows Hello."

Scenario: add a passkey with no name
  Given I go to the "Root" page
  And I sign in as the "onePasskey" user
  And I go to the "Security" page
  Then I click the "Manage your sign in details" link
  Then I click the "Set up a passkey" link
  Then I enter and submit my password "qwerty"
  Then I click the "passkey-create success (passkey has no display name)" link
  Then the page does not contain the text "Your passkey is saved to Windows Hello."

Scenario: add a passkey fails when account has interventions (blocked)
  Given I go to the "Root" page
  And I sign in as the "onePasskey" user
  And I go to the "Security" page
  Then I click the "Manage your sign in details" link
  Then I click the "Set up a passkey" link
  Then I enter and submit my password "qwerty"
  And the page has finished loading
  Then I click the "passkey-create account has interventions (blocked)" link
  Then the page title is prefixed with "Your GOV.UK One Login has been permanently locked"

Scenario: add a passkey fails when account has interventions (blocked, no actions specified)
  Given I go to the "Root" page
  And I sign in as the "onePasskey" user
  And I go to the "Security" page
  Then I click the "Manage your sign in details" link
  Then I click the "Set up a passkey" link
  Then I enter and submit my password "qwerty"
  And the page has finished loading
  Then I click the "passkey-create account has interventions (blocked, no actions specified)" link
  Then the page title is prefixed with "Your GOV.UK One Login has been permanently locked"  

Scenario: add a passkey fails when account has interventions (suspended, no actions specified)
  Given I go to the "Root" page
  And I sign in as the "onePasskey" user
  And I go to the "Security" page
  Then I click the "Manage your sign in details" link
  Then I click the "Set up a passkey" link
  Then I enter and submit my password "qwerty"
  And the page has finished loading
  Then I click the "passkey-create account has interventions (suspended, no actions specified)" link
  Then the page contains the text "You cannot use your GOV.UK One Login at the moment"

Scenario: add a passkey fails when account has interventions (suspended, no actions required)
  Given I go to the "Root" page
  And I sign in as the "onePasskey" user
  And I go to the "Security" page
  Then I click the "Manage your sign in details" link
  Then I click the "Set up a passkey" link
  Then I enter and submit my password "qwerty"
  And the page has finished loading
  Then I click the "passkey-create account has interventions (suspended, no actions required)" link
  Then the page contains the text "You cannot use your GOV.UK One Login at the moment"  

Scenario: add a passkey fails when account has interventions (suspended, reset password required)
  Given I go to the "Root" page
  And I sign in as the "onePasskey" user
  And I go to the "Security" page
  Then I click the "Manage your sign in details" link
  Then I click the "Set up a passkey" link
  Then I enter and submit my password "qwerty"
  And the page has finished loading
  Then I click the "passkey-create account has interventions (suspended, reset password required)" link
  Then the page contains the text "You cannot use your GOV.UK One Login at the moment"    

Scenario: add a passkey fails when account has interventions (suspended, reprove identity required)
  Given I go to the "Root" page
  And I sign in as the "onePasskey" user
  And I go to the "Security" page
  Then I click the "Manage your sign in details" link
  Then I click the "Set up a passkey" link
  Then I enter and submit my password "qwerty"
  And the page has finished loading
  Then I click the "passkey-create account has interventions (suspended, reprove identity required)" link
  Then the page contains the text "You cannot use your GOV.UK One Login at the moment"      

Scenario: add a passkey fails when account has interventions (suspended, reset password and reprove identity required)
  Given I go to the "Root" page
  And I sign in as the "onePasskey" user
  And I go to the "Security" page
  Then I click the "Manage your sign in details" link
  Then I click the "Set up a passkey" link
  Then I enter and submit my password "qwerty"
  And the page has finished loading
  Then I click the "passkey-create account has interventions (suspended, reset password and reprove identity required)" link
  Then the page contains the text "You cannot use your GOV.UK One Login at the moment"        

Scenario: remove a passkey
  Given I go to the "Root" page
  And I sign in as the "fourPasskeys" user
  And I go to the "Security" page
  Then I click the "Manage your sign in details" link
  Then I click the "Remove iCloud Keychain (Managed) passkey" link
  Then I enter and submit my password "qwerty"
  Then the page title is prefixed with "Remove your passkey"
  And the page looks as expected
  Given I click the "Remove passkey" button
  Then the page title is prefixed with "You’ve removed your passkey"
  And the page looks as expected

Scenario: remove a passkey without a name
  Given I go to the "Root" page
  And I sign in as the "onePasskeyNoDisplayName" user
  And I go to the "Security" page
  And I click the "Manage your sign in details" link
  And I click the "Remove passkey" link
  And I enter and submit my password "qwerty"
  Then the page title is prefixed with "Remove your passkey"
  And the page looks as expected
  Then I click the "Remove passkey" button
  Then the page title is prefixed with "You’ve removed your passkey"
  Then the page looks as expected

Scenario: pressing back from remove passkey confirmation redirects to your services
  Given I go to the "Root" page
  And I sign in as the "fourPasskeys" user
  And I go to the "Security" page
  And I click the "Manage your sign in details" link
  And I click the "Remove iCloud Keychain (Managed) passkey" link
  And I enter and submit my password "qwerty"
  Then the page title is prefixed with "Remove your passkey"
  Given I click the "Remove passkey" button
  And I navigate back
  Then the page title is prefixed with "Your services"
