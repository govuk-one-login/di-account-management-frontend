FROM node:20.19.1-bookworm@sha256:f92975033d369a01c416ef0e2a088d4bff00a0b1e6aab3c3cdd0f9af21b75fa5

# Set up AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

ENV AWS_PAGER=""

COPY . .

RUN npm ci
RUN npx playwright install --with-deps chrome
ENTRYPOINT [ "/run-tests.sh" ]
