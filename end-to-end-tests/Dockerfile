FROM node:24.3.0-bookworm@sha256:4b383ce285ed2556aa05a01c76305405a3fecd410af56e2d47a039c59bdc2f04

# Set up AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

ENV AWS_PAGER=""

WORKDIR /end-to-end-tests

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY run-tests.sh run-tests.sh

RUN npm ci && npm run install-browsers

ENTRYPOINT [ "./run-tests.sh" ]
