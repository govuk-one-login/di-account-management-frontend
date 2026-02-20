Feature: Change Default MFA Method From Authenticator App

    @failMobile
    Scenario: Change Default Method with no SMS backup
        Given I go to the "Root" page
        And I sign in as the "userDEFAULTAuthApp" user
        And I go to the "Security" page
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Security"
        Given I click the "Use a different default method" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your password"
        Given I enter and submit my password "f4kePa55wo2d?!"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Use a different default method"
        Given I click the "Add a UK mobile phone number" button
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your UK mobile phone number"
        Given I enter and submit my new mobile phone number "07890123456"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Check your phone"
        And I am shown a message confirming a code has been sent to my new phone number ending "3456"
        Given I enter and submit the code "123456" sent to my new mobile number ending "3456"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "You’ve changed your default method for getting security codes"
        And I am shown a message confirming that my Default Method has been changed
        # The following step is disabled pending fixing the stubs to return the correct data.
        # And I am shown a message confirming security codes will be sent to my phone number ending "3456"


    @failMobile
    Scenario: Change Default Method with no SMS Backup leaving at Use a different default method screen
        Given I go to the "Root" page
        And I sign in as the "userDEFAULTAuthApp" user
        And I go to the "Security" page
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Security"
        Given I click the "Use a different default method" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your password"
        Given I enter and submit my password "f4kePa55wo2d?!"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Use a different default method"
        Given I click the "I do not have a UK mobile phone number" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "If you do not have a UK mobile phone number"
        And I am shown a message explaining what I can do
        And I am shown a message explaining how to change to a different authenticator app
        And there is a "Go back to Security" button

    @failMobile
    Scenario: Change Default Method with no SMS Backup leaving at Enter your UK mobile phone number screen
        Given I go to the "Root" page
        And I sign in as the "userDEFAULTAuthApp" user
        And I go to the "Security" page
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Security"
        Given I click the "Use a different default method" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your password"
        Given I enter and submit my password "f4kePa55wo2d?!"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Use a different default method"
        Given I click the "Add a UK mobile phone number" button
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your UK mobile phone number"
        Given I click the "I do not have a UK mobile phone number" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "If you do not have a UK mobile phone number"
        And I am shown a message explaining what I can do
        And I am shown a message explaining how to change to a different authenticator app
        And there is a "Go back to Security" button

    @failMobile
    Scenario: Change Default Method with SMS Backup
        Given I go to the "Root" page
        And I sign in as the "userDEFAULTAuthAppBackupSms" user
        And I go to the "Security" page
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Security"
        Given I click the "Use a different default method" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your password"
        Given I enter and submit my password "f4kePa55wo2d?!"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Use a different default method"
        Given I click the "Add a UK mobile phone number" button
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your UK mobile phone number"
        Given I enter and submit my new mobile phone number "07890123456"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Check your phone"
        And I am shown a message confirming a code has been sent to my new phone number ending "3456"
        Given I enter and submit the code "123456" sent to my new mobile number ending "3456"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "You’ve changed your default method for getting security codes"
        And I am shown a message confirming that my Default Method has been changed
        # The following step is disabled pending fixing the stubs to return the correct data.
        # And I am shown a message confirming security codes will be sent to my phone number ending "3456"

    @failMobile
    Scenario: Change Default Method with SMS Backup leaving at Use a different default method screen
        Given I go to the "Root" page
        And I sign in as the "userDEFAULTAuthAppBackupSms" user
        And I go to the "Security" page
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Security"
        Given I click the "Use a different default method" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your password"
        Given I enter and submit my password "f4kePa55wo2d?!"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Use a different default method"
        Given I click the "I do not have a UK mobile phone number" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "If you do not have a UK mobile phone number"
        And I am shown a message explaining what I can do
        And I am shown a message explaining how to change to a different authenticator app
        And there is a "Cancel and go back to Security" button

    @failMobile
    Scenario: Change Default Method with SMS Backup leaving at Enter your UK mobile phone number screen
        Given I go to the "Root" page
        And I sign in as the "userDEFAULTAuthAppBackupSms" user
        And I go to the "Security" page
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Security"
        Given I click the "Use a different default method" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your password"
        Given I enter and submit my password "f4kePa55wo2d?!"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Use a different default method"
        Given I click the "Add a UK mobile phone number" button
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your UK mobile phone number"
        Given I click the "I do not have a UK mobile phone number" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "If you do not have a UK mobile phone number"
        And I am shown a message explaining what I can do
        And I am shown a message explaining how to change to a different authenticator app
        And there is a "Cancel and go back to Security" button
