FROM node:20.19.2-bookworm@sha256:7c4cd7c6935554b79c6fffb88e7bde3db0ce25b45d4c634d1fb0f1a6e7f5b782

# Set up AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

ENV AWS_PAGER=""

COPY . .

RUN npm ci
RUN npx playwright install --with-deps chrome
ENTRYPOINT [ "/run-tests.sh" ]
