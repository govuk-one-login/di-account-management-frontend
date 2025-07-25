FROM node:20.19.4-bookworm@sha256:122a9a65b1f1c11993ad8c0d344602296eb79dda1b4d49ec1965058208418fe7

# Set up AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

ENV AWS_PAGER=""

COPY . .

RUN npm ci
RUN npx playwright install --with-deps chrome
ENTRYPOINT [ "/run-tests.sh" ]
