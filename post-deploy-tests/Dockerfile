FROM node:20.19.0-bookworm@sha256:a5fb035ac1dff34a4ecaea85f90f7321185695d3fd22c12ba12f4535a4647cc5

# Set up AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

ENV AWS_PAGER=""

COPY . .

RUN npm ci
RUN npx playwright install --with-deps chrome
ENTRYPOINT [ "/run-tests.sh" ]
