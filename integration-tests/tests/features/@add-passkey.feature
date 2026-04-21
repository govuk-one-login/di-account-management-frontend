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
  And the page has finished loading
  Then the page does not contain the text "Your passkey is saved to Windows Hello."
