FROM node:20.19.6-bookworm@sha256:4b4e58e59c5e042928790c6fccd8ad16da6296bcc2e9924c56fba84a8e5ff662

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

ENV AWS_PAGER=""

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci && npm run install-browsers

COPY . .

ENTRYPOINT [ "./run-tests.sh" ]
