FROM node:19.6.0-alpine@sha256:72b0f918ad76b5ef68c6243869fab5800d7393c1dcccf54ef00958c2abc8164a

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD yarn install && yarn copy-assets && yarn dev