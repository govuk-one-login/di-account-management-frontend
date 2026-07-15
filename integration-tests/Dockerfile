# Despite what SonarQube says both the tag and sha digest are needed:
# the digest pins the exact image for reproducibility,
# the tag allows Dependabot to evaluate version constraints
FROM node:24.18.0-bookworm@sha256:392e1e23f34da768d8d1f4e502b64f200d3be3465934d4b7930f57d7e2fc1989

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

ENV AWS_PAGER=""

COPY package.json package.json
COPY package-lock.json package-lock.json

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npm ci && npm run install-browsers

COPY . .

HEALTHCHECK NONE

USER node

ENTRYPOINT [ "./run-tests.sh" ]
