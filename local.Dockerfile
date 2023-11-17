FROM node:21.2.0-alpine@sha256:4a512d1538b1a8281b58cab0b366a5c62436566bb63e7dcd4a6769c98edb3b5f

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run dev
