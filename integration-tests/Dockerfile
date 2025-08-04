FROM node:20.19.4-bookworm@sha256:2c071012e93673d595e1399564c4a48a70a5c0a0acd7db8211d5e6f6316b431a

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

ENV AWS_PAGER=""

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci && npm run install-browsers

COPY . .

ENTRYPOINT [ "./run.sh" ]
