# Despite what SonarQube says both the tag and sha digest are needed:
# the digest pins the exact image for reproducibility,
# the tag allows Dependabot to evaluate version constraints
FROM node:24.22.2-bookworm@sha256:8fa96264f302f58bbb13aa7339c541547b56975766ce956c875da149452a3e40

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
