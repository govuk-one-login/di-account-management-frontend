FROM node:20.20.1-bookworm@sha256:f6a6faaedf0e8ec72d6f56f421f2dcb3871da0943b08c342bfed527357ff3e7c

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

ENV AWS_PAGER=""

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci && npm run install-browsers

COPY . .

ENTRYPOINT [ "./run-tests.sh" ]
