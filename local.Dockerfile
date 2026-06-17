FROM node:20.20.2-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293

ENV NODE_ENV "development"
ENV PORT 6001

RUN apk add --no-cache git shadow

RUN usermod -u 1001 node && \
    groupmod -g 1001 node

VOLUME ["/app"]
WORKDIR /app

RUN chown -R node:node /app
USER node

RUN git config --global --add safe.directory /app

EXPOSE $PORT

HEALTHCHECK NONE

CMD npm run install-all && npm run copy-assets && npm run dev
