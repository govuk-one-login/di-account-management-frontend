FROM node:20.19.5-bookworm@sha256:d22c0ce19226056c67dcc9550894161cf61200b60eb8be78ddbd8ee574871011

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

ENV AWS_PAGER=""

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci && npm run install-browsers

COPY . .

ENTRYPOINT [ "./run-tests.sh" ]
