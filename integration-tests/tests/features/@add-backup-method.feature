Feature: Add Backup SMS MFA Method

    @failMobile
    Scenario: Add Backup SMS MFA with SMS as Default
        Given I go to the "Root" page
        And I sign in as the "userDEFAULTSms" user
        And I go to the "Security" page
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Security"
        Given I click the "Add a back-up method" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your password"
        Given I enter and submit my password "f4kePa55wo2d?!"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Add a back-up method"
        And I can see two radio buttons
        And I can see a collapsed detail block "What is an authenticator app"
        Given I click the detail block "What is an authenticator app"
        Then I can see the explanation details "An authenticator app creates a security code that helps confirm it’s you when you sign in."
        Given I select "UK mobile phone number" and click the "continue" button
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
        And the page title is prefixed with "You’ve added a back-up method for getting security codes"
        And I am shown a message confirming that I have added a backup method
        And I am shown a message confirming I can receive codes on my backup SMS number ending "3456"
        And I can see the "Back to Security" button

    @failMobile
    Scenario: Add Backup SMS MFA with SMS as Default no UK mobile number
        Given I go to the "Root" page
        And I sign in as the "userDEFAULTSms" user
        And I go to the "Security" page
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Security"
        Given I click the "Add a back-up method" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your password"
        Given I enter and submit my password "f4kePa55wo2d?!"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Add a back-up method"
        And I can see two radio buttons
        And I can see a collapsed detail block "What is an authenticator app"
        Given I click the detail block "What is an authenticator app"
        Then I can see the explanation details "An authenticator app creates a security code that helps confirm it’s you when you sign in."
        Given I select "UK mobile phone number" and click the "continue" button
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your UK mobile phone number"
        And I can see a collapsed detail block "I do not have a UK mobile phone number"
        Given I click the detail block "I do not have a UK mobile phone number"
        Then I can see an explanation and link to start this journey again
        Given I click the "Go back to choose authenticator app" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Add a back-up method"
        And I can see two radio buttons
        And I have an option to select Authenticator App

    @failMobile
    Scenario: Add Backup SMS with Authenticator App as Default
        Given I go to the "Root" page
        And I sign in as the "userDEFAULTAuthApp" user
        And I go to the "Security" page
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Security"
        Given I click the "Add a back-up method" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your password"
        Given I enter and submit my password "f4kePa55wo2d?!"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Add a back-up method"
        And I can see the "Add a UK mobile phone number" button
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
        And the page title is prefixed with "You’ve added a back-up method for getting security codes"
        And I am shown a message confirming that I have added a backup method
        And I am shown a message confirming I can receive codes on my backup SMS number ending "3456"
        And I can see the "Back to Security" button

    @failMobile
    Scenario: Add Backup SMS with Authenticator App as Default no UK mobile number
        Given I go to the "Root" page
        And I sign in as the "userDEFAULTAuthApp" user
        And I go to the "Security" page
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Security"
        Given I click the "Add a back-up method" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your password"
        Given I enter and submit my password "f4kePa55wo2d?!"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Add a back-up method"
        And I can see the "Add a UK mobile phone number" button
        And I can see a collapsed detail block "I do not have a UK mobile phone number"
        Given I click the detail block "I do not have a UK mobile phone number"
        Then I can see the explanation details "To get security codes by text message you must use a UK mobile phone number."
        And I can see the explanation details "As you already use an authenticator app to get security codes, you cannot add another one as a back-up method."
        Given I click the "Cancel and go back to security" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Security"
