Feature: Change phone number

    @failMobile
    Scenario: Change phone number
        Given I go the "Root" page
        And I sign in as teh "default" user
        And I go to the "Security" page
        Then the page title is prefixed with "Security"
        Given I click the "Change phone number" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your password"
        Given I enter and submit my password "f4kePa55wo2d?!"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your new UK mobile phone number"
        Given I enter and submit my new mobile phone number "07890123456"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Check your phone"
        Given I enter and submit the code "123456" sent to my new mobile number "07890123456"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "You've changed your phone number"
        And I am shown a message confirming that my phone number has been chnaged
        And I am shown a message confirming security codes will be sent to my phone number ending "3456"

    Scenario: Use a non-UK phone number
        Given I go the "Root" page
        And I sign in as teh "default" user
        And I go to the "Security" page
        Then the page title is prefixed with "Security"
        Given I click the "Change phone number" link
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your password"
        Given I enter and submit my password "f4kePa55wo2d?!"
        And the page has finished loading
        Then the page meets our accessibility standards
        And the page title is prefixed with "Enter your new UK mobile phone number"
        Given I enter and submit my new mobile phone number "33645453322"
        And the page has finished loading
