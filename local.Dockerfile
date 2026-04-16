FROM node:20.20.2-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

RUN apk add --no-cache git && git config --global --add safe.directory /app

CMD npm run install-all && npm run copy-assets && npm run dev
