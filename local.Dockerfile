FROM node:16.19.1@sha256:667dc6ed8fc6623ccd21cb5fa355c90f848daaf5d6df96bc940869bfdf91c19a

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD yarn install && yarn copy-assets && yarn dev