FROM node:20.20.0-bookworm@sha256:3680462e16df266d30b103a3e38e2bc315bf917d0ab873fbddbee437bf0bd2d0

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

ENV AWS_PAGER=""

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci && npm run install-browsers

COPY . .

ENTRYPOINT [ "./run-tests.sh" ]
