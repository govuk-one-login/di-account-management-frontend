FROM node:22.3.0-alpine@sha256:dfd61407706dee667f08be1bb079d2f2c6643f69ed5d2abe5c180b5e6cd1733a

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run dev
