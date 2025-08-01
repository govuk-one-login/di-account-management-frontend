Feature: "Services you can use with GOV.UK One Login" page

  @failMobile @failTarget-integration @failTarget-production
  Scenario: Visit the "Services you can use with GOV.UK One Login" page
    Given I go to the "Services you can use with GOV.UK One Login" page
    And the page has finished loading
    And I accept cookies
    Then the page title is prefixed with "Services you can use with GOV.UK One Login"
    And the page looks as expected
    And the page meets our accessibility standards
    Given I search for "APAR"
    Then there is a search result with the text "Apprenticeship provider and assessment register (APAR)"
    Given I search for "barring"
    Then there is a search result with the text "Request a basic DBS check"
    Given I search for "Ofqual subject matter specialist account"
    Then there is a search result with the text "Ofqual subject matter specialist account"
