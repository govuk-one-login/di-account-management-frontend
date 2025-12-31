FROM node:20.19.6-bookworm@sha256:929de1eecc6450613bf37eea2f93f3d362b536a465d74e962488b5eca1168948

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

ENV AWS_PAGER=""

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci && npm run install-browsers

COPY . .

ENTRYPOINT [ "./run-tests.sh" ]
