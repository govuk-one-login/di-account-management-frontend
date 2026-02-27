Feature: JWKS Endpoint

  @postDeploy
  Scenario: Access JWKS endpoint without authentication
    When I open the url "/.well-known/jwks.json"
    Then the response status code should be 200
    And the response should be valid JSON

  @postDeploy
  Scenario: JWKS contains valid key structure
    When I open the url "/.well-known/jwks.json"
    Then the response should contain a "keys" array
    And each key should have a "kty" field with value "RSA"
    And each key should have a "use" field with value "sig"
    And each key should have a "kid" field
    And each key should have a "n" field
    And each key should have a "e" field with value "AQAB"

  @postDeploy
  Scenario: JWKS endpoint has proper cache headers
    When I open the url "/.well-known/jwks.json"
    Then the response should have cache control header "public, max-age=3600"
