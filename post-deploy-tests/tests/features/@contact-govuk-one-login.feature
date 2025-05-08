Feature: Contact GOV.UK One Login

  Scenario: Visiting the contact page
    Given I visit the contact page
    Then the page should have status code 200
