# ADR: Utilizing OpenAPI Specification for API Client Generation

## Context

An incident occurred due to a change in an API call, leading to unintended consequences. During the post-mortem, it was identified that such incidents could be mitigated by improving how API changes are managed and integrated. 

## Decision

To use the existing OpenAPI specification to generate an API client automatically. This client will be integrated into our system, providing type definitions and ensuring consistency in API interactions. The generated client will serve as the single source of truth for API calls, mitigating risks associated with API changes.

### Automated API Client Generation using OpenAPI

- **Positive Consequences**:
  - **Type Safety**: With the generated client, type definitions are included, enabling build-time checks for API changes.
  - **Consistency**: Ensures that all API interactions are standardized and updated automatically.
  - **Early Error Detection**: Any breaking changes in the API will cause the build to fail, allowing issues to be caught early.

- **Negative Consequences**:
  - **Dependency on Specification Accuracy**: The generated client relies on the accuracy of the OpenAPI specification, requiring diligent maintenance.

## Implementation Plan

1. **Client Generation Command**:
   - Add a command to the frontend repository for generating the API client from the OpenAPI specification.

2. **Refactoring**:
   - Refactor the codebase to replace direct API calls with calls to the generated client.

3. **CI/CD Integration**:
   - Implement a build step in the CI/CD pipeline to verify that the API specification remains consistent. This includes checking out the latest specification, regenerating the client, and comparing it with the committed version.

## Challenges

1. **Private OpenAPI Specification**:
   - The current specification is private. A decision needs to be made about making it public.

2. **Specification Maintenance**:
   - The OpenAPI specification includes a disclaimer about its reliability. Collaboration with the API producer teams is necessary to ensure the specification's accuracy and upkeep.