FROM node:19.5.0-alpine@sha256:4619ec6c9a43ab4edfa12cf96745319c3ca43aff9dd630ab20e684dd3632318e

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD yarn install && yarn copy-assets && yarn dev