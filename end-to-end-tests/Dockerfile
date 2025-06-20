FROM node:20.19.2-bookworm@sha256:34ebf3e5d4a51d4b1af4b78188f9b0ad0daf1d763395e2390ab935f910350b78

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
