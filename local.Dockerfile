FROM node:20.15.1-alpine@sha256:cf5e7b223dea2efc6a73c55c6655b740576fe9c2596927a53533feded0fb5f5f

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run build-js:analytics && npm run dev
