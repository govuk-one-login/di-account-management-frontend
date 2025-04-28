FROM node:20.19.1-bookworm@sha256:2b925d94e306faa9f9eca22852d2f0f79bc9192ce778e1cd435928e6a44f9164

# Set up AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

ENV AWS_PAGER=""

COPY . .

RUN npm ci
RUN npx playwright install --with-deps chrome
ENTRYPOINT [ "/run-tests.sh" ]
